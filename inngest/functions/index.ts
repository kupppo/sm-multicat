import InertiaAPI from '@/lib/inertia'
import { inngest } from '../client'
import { NonRetriableError } from 'inngest'

type RaceEventData = {
  matchId: string
  raceId: string
  racetimeUrl: string
}

export const handleRaceStart = inngest.createFunction(
  { id: 'handle-race-start' },
  { event: 'race/initiate' },
  async ({ event, step }) => {
    const data = event.data as RaceEventData
    const matchUrl = new URL(
      `match/${data.matchId}`,
      'https://smmc.inertia.run',
    )

    // Get match
    const match = await step.run('get-match', async () => {
      const tournamentSlug = process.env.TOURNAMENT_SLUG!
      const entry = await InertiaAPI(
        `/api/tournaments/${tournamentSlug}/matches/${data.matchId}`,
        {
          method: 'GET',
        },
      )
      if (!entry) {
        throw new NonRetriableError('Match not found')
      }
      return entry
    })

    // Determine if third race or not
    const lastRace = await step.run('determine-race-number', async () => {
      const race = match.races.find((race: any) => race.id === data.raceId)
      if (!race) {
        throw new NonRetriableError('Race not found')
      }

      const raceNumber = race.ordering
      if (raceNumber === 2) {
        // roll random seed
        return true
      }

      return false
    })

    // Send message if not last race
    if (!lastRace) {
      await step.run('progress-match', async () => {
        const matchState = match.metafields.find(
          (metafield: any) => metafield.key === 'status',
        )
        if (!matchState) {
          throw new NonRetriableError('Match Metafield not found')
        }

        // If it's the first race, the status should be AWAITING_PLAYER_ASSIGNMENT and needs no update
        // If it's the start of the second race, update the status
        if (matchState.value === 'PLAYING_RACE_1') {
          await InertiaAPI('/api/metafields', {
            method: 'PUT',
            payload: {
              key: 'status',
              value: 'PLAYER_1_PICK',
              model: 'match',
              modelId: data.matchId,
            },
          })
        }
      })

      await step.run('send-msg', async () => {
        const msg = `Please visit ${matchUrl.toString()} to setup the options for this race`
        await InertiaAPI('/api/racetime/race/msg', {
          method: 'POST',
          payload: {
            msg: msg,
            roomUrl: data.racetimeUrl,
          },
        })
      })
    } else {
      // Assign random mode not already picked
      // Broadcast changes to racetime room
    }
  },
)

export const handleRaceEnd = inngest.createFunction(
  { id: 'handle-race-end' },
  { event: 'race/end' },
  async ({ event, step }) => {
    const data = event.data as RaceEventData
    await step.run('progress-match', async () => {
      const tournamentSlug = process.env.TOURNAMENT_SLUG!
      const match = await InertiaAPI(
        `/api/tournaments/${tournamentSlug}/matches/${data.matchId}`,
        {
          method: 'GET',
        },
      )
      if (!match) {
        throw new NonRetriableError('Match not found')
      }

      const matchState = match.metafields.find(
        (metafield: any) => metafield.key === 'status',
      )
      if (!matchState) {
        throw new NonRetriableError('Match Metafield not found')
      }

      let newState = 'PLAYER_1_PICK'
      if (matchState.value === 'PLAYING_RACE_2') {
        newState = 'PLAYING_RACE_3'
      }
      const update = await InertiaAPI('/api/metafields', {
        method: 'PUT',
        payload: {
          key: 'status',
          value: newState,
          model: 'match',
          modelId: data.matchId,
        },
      })
    })
  },
)
