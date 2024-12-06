import InertiaAPI from '@/lib/inertia'
import { inngest } from '../client'
import { NonRetriableError } from 'inngest'
import { RaceModes } from '@/app/config/tournament'

type RaceEventData = {
  matchId: string
  raceId: string
  racetimeUrl: string
}

type RaceModeEventData = {
  racetimeUrl: string
  mode: string
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

      const awaitScheduledTime = await step.run(
        'await-scheduled-time',
        async () => {
          const race = match.races.find((race: any) => race.id === data.raceId)
          if (!race) {
            return null
          }
          if (race.scheduleOnFinish) {
            return null
          }
          if (race.scheduledAt) {
            try {
              const scheduledTime = new Date(race.scheduledAt)
              scheduledTime.setMinutes(scheduledTime.getMinutes() - 10)
              return scheduledTime.toISOString()
            } catch (err) {
              return null
            }
          }
          return null
        },
      )

      if (awaitScheduledTime) {
        await step.run('send-initial-message', async () => {
          const msg = `The options for this race will be sent to this room 10 minutes prior to the scheduled time.`
          await InertiaAPI('/api/racetime/race/msg', {
            method: 'POST',
            payload: {
              msg: msg,
              roomUrl: data.racetimeUrl,
            },
          })
        })
        await step.sleepUntil('wait-until-10m-prior', awaitScheduledTime)
      }

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
      await step.run('set-final-match', async () => {
        // Assign random mode not already picked
        // Broadcast changes to racetime room
        const selectedKeys = [
          'player_1_pick',
          'player_2_pick',
          'player_1_veto',
          'player_2_veto',
        ]
        const selectedModes = match.metafields
          .filter((metafield: any) => selectedKeys.includes(metafield.key))
          .map((metafield: any) => metafield.value)
        const nonSelectedModes = RaceModes.filter(
          (mode) => !selectedModes.includes(mode.slug),
        )
        const randomMode =
          nonSelectedModes[Math.floor(Math.random() * nonSelectedModes.length)]
        await InertiaAPI('/api/metafields', {
          method: 'POST',
          payload: {
            key: 'game_3_mode',
            value: randomMode.slug,
            model: 'match',
            modelId: data.matchId,
          },
        })
        await inngest.send({
          name: 'race/mode.select',
          data: {
            mode: randomMode.slug,
            roomUrl: data.racetimeUrl,
          },
        })
        const msg = `This race will be set to ${randomMode.name} shortly.`
        await InertiaAPI('/api/racetime/race/msg', {
          method: 'POST',
          payload: {
            msg: msg,
            roomUrl: data.racetimeUrl,
          },
        })
      })
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

export const handleModeSelection = inngest.createFunction(
  { id: 'handle-mode-selection' },
  { event: 'race/mode.select' },
  async ({ event, step }) => {
    const data = event.data as RaceModeEventData
    await step.run('set-mode-on-racetime', async () => {
      const mode = RaceModes.find((mode) => mode.slug === data.mode)
      if (!mode) {
        throw new NonRetriableError(`Mode not found: ${data.mode}`)
      }

      await InertiaAPI('/api/racetime/race', {
        method: 'PUT',
        payload: {
          roomUrl: data.racetimeUrl,
          goal: mode.slug,
        },
      })
    })
  },
)
