'use client'

import usePartySocket from 'partysocket/react'
import { PARTYKIT_HOST } from '@/app/env'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { MatchStates, RaceModes } from '@/app/config/tournament'
import { setFirstPlayer, setRaceMode, setVetoMode } from '@/app/actions/match'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import { cn } from '@/lib/utils'

const PlayerAssignment = ({
  higherSeed,
  opponentId,
  userId,
  matchId,
}: {
  higherSeed: string | null
  opponentId: string
  userId: string
  matchId: string
}) => {
  const handleSubmit = async (playerId: string) => {
    const toastId = toast('Setting first player...')
    try {
      await setFirstPlayer(playerId, matchId)
      toast.success('First player set!', { id: toastId })
      const evt = new CustomEvent('live:update', {
        detail: { eventName: 'match:player_assigned', playerId },
      })
      document.dispatchEvent(evt)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message, { id: toastId })
    }
  }
  const isHigherSeed = higherSeed === userId || false
  return (
    <div>
      <h3>Player Assignment</h3>
      {isHigherSeed ? (
        <div>
          <p>You need to pick if to be player 1 or 2.</p>
          <Button onClick={() => handleSubmit(userId)}>Player 1</Button>
          <Button onClick={() => handleSubmit(opponentId)}>Player 2</Button>
        </div>
      ) : (
        <div>
          <p>Waiting for the other player to pick...</p>
        </div>
      )}
    </div>
  )
}

const AwaitingSeed = () => {
  return (
    <div>
      <h3>Awaiting Seed</h3>
    </div>
  )
}

const disabledModes = (props: any) =>
  [
    props.player1Veto,
    props.player2Veto,
    props.player1Pick,
    props.player2Pick,
  ].filter(Boolean)

const PlayerVeto = (props: any) => {
  const { firstPlayer, status, userId } = props
  let picker = false
  if (status === 'PLAYER_1_VETO' && firstPlayer === userId) {
    console.log(picker)
    picker = true
  } else if (status === 'PLAYER_2_VETO' && firstPlayer !== userId) {
    picker = true
  }

  const disabled = disabledModes(props)

  const handleSubmit = async (vetoValue: string) => {
    const toastId = toast('Setting pick...')
    try {
      const vetoKey = `player_${props.isFirstPlayer ? '1' : '2'}_veto`
      await setVetoMode(vetoValue, props.matchId, vetoKey)
      toast.success('Pick set', { id: toastId })
      const evt = new CustomEvent('live:update', {
        detail: { eventName: `match:${vetoKey}` },
      })
      document.dispatchEvent(evt)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message, { id: toastId })
    }
  }
  return (
    <div>
      <h3>Player Veto</h3>
      {picker ? (
        <>
          <p>Available Modes:</p>
          <ul className="flex flex-col max-w-[200px] gap-2">
            {RaceModes.map((mode) => (
              <li key={mode.slug} className="w-full">
                <Button
                  variant="default"
                  className={cn(
                    'w-full block',
                    disabled.includes(mode.slug) && 'line-through',
                  )}
                  onClick={() => handleSubmit(mode.slug)}
                  disabled={disabled.includes(mode.slug)}
                >
                  {mode.name}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Waiting for the other player to pick...</p>
      )}
    </div>
  )
}

const PlayerPick = (props: any) => {
  const { firstPlayer, status, userId } = props
  let picker = false
  if (status === 'PLAYER_1_PICK' && firstPlayer === userId) {
    console.log(picker)
    picker = true
  } else if (status === 'PLAYER_2_PICK' && firstPlayer !== userId) {
    picker = true
  }

  const disabled = disabledModes(props)

  const handleSubmit = async (pickValue: string) => {
    const toastId = toast('Setting pick...')
    try {
      const pickKey = `player_${props.isFirstPlayer ? '1' : '2'}_pick`
      await setRaceMode(pickValue, props.matchId, pickKey)
      toast.success('Pick set', { id: toastId })
      const evt = new CustomEvent('live:update', {
        detail: { eventName: `match:${pickKey}` },
      })
      document.dispatchEvent(evt)
    } catch (err: unknown) {
      const error = err as Error
      toast.error(error.message, { id: toastId })
    }
  }
  return (
    <div>
      <h3>Player Pick</h3>
      {picker ? (
        <>
          <p>Available Modes:</p>
          <ul className="flex flex-col max-w-[200px] gap-2">
            {RaceModes.map((mode) => (
              <li key={mode.slug} className="w-full">
                <Button
                  variant="default"
                  className={cn(
                    'w-full block',
                    disabled.includes(mode.slug) && 'line-through',
                  )}
                  onClick={() => handleSubmit(mode.slug)}
                  disabled={disabled.includes(mode.slug)}
                >
                  {mode.name}
                </Button>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Waiting for the other player to pick...</p>
      )}
    </div>
  )
}

const Race = (props: any) => {
  const raceNum = props.status.split('_')[2]
  return <p>Playing Race {raceNum}</p>
}

const getState = (status: string, props: any) => {
  switch (status) {
    case 'AWAITING_SEED':
      return <AwaitingSeed />
    case 'AWAITING_PLAYER_ASSIGNMENT':
      return <PlayerAssignment {...props} />
    case 'PLAYER_1_VETO':
    case 'PLAYER_2_VETO':
      return <PlayerVeto {...props} />
    case 'PLAYER_1_PICK':
    case 'PLAYER_2_PICK':
      return <PlayerPick {...props} />
    case 'PLAYING_RACE_1':
    case 'PLAYING_RACE_2':
      return <Race {...props} />
    default:
      return <div>Unknown State: {status}</div>
  }
}

async function fetcher(key: string) {
  const res = await fetch(key)
  return res.json()
}

const getMode = (slug: string) => {
  try {
    const mode = RaceModes.find((mode) => mode.slug === slug)
    if (!mode) {
      throw new Error('Mode not found')
    }
    return mode.name
  } catch (err) {
    return '-'
  }
}

export default function RealtimeUpdates({
  matchId,
  ...fallbackData
}: {
  matchId: string
}) {
  const router = useRouter()
  const { data, isLoading, mutate } = useSWR(`/api/match/${matchId}`, fetcher, {
    fallbackData,
  })
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: matchId,
    onMessage(event) {
      console.log('msg received:', event.data)
      const refreshEvt = new CustomEvent('refresh:update')
      document.dispatchEvent(refreshEvt)
    },
  })

  useEffect(() => {
    function handleEvent(evt: Event) {
      const event = evt as CustomEvent
      console.log('live:update', event.detail)
      socket.send(JSON.stringify(event.detail))
    }
    function handleRefresh() {
      mutate()
    }
    document.addEventListener('live:update', handleEvent)
    document.addEventListener('refresh:update', handleRefresh)

    return () => {
      document.removeEventListener('live:update', handleEvent)
      document.removeEventListener('refresh:update', handleRefresh)
    }
  }, [mutate, router, socket])

  if (isLoading) {
    return <div>is loading</div>
  }

  const status = MatchStates.find((state) => state.slug === data.status)
  if (!status) {
    return null
  }

  const firstPlayerName = data.racers[data.firstPlayer]
  const secondPlayer = Object.keys(data.racers).find(
    (id: string) => id !== data.firstPlayer,
  )
  const secondPlayerName = data.racers[secondPlayer!]
  const RenderedState = getState(status.slug, data)

  return (
    <div>
      <ul>
        <li>Match Status: {status?.name}</li>
        {data.higherSeed && (
          <li>Higher Seed: {data.racers[data.higherSeed]}</li>
        )}
        {data.firstPlayer && (
          <>
            <li>Player 1: {firstPlayerName}</li>
            <li>Player 2: {secondPlayerName}</li>
          </>
        )}
        <li>Player 1 Veto: {getMode(data.player1Veto)}</li>
        <li>Player 2 Veto: {getMode(data.player2Veto)}</li>
        <li>Game 1: {getMode(data.player2Pick)}</li>
        <li>Game 2: {getMode(data.player1Pick)}</li>
        <li>Game 3: {getMode(data.game3Mode)}</li>
      </ul>
      {RenderedState}
    </div>
  )
}
