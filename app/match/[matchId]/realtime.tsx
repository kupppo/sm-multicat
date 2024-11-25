'use client'

import usePartySocket from 'partysocket/react'
import { PARTYKIT_HOST } from '@/app/env'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { MatchStates, RaceModes } from '@/app/config/tournament'
import { setFirstPlayer } from '@/app/actions/match'
import { toast } from 'sonner'

const PlayerAssignment = ({
  isFirstPlayer,
  opponentId,
  userId,
  matchId,
}: {
  isFirstPlayer: boolean | null
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
  return (
    <div>
      <h3>Player Assignment</h3>
      {isFirstPlayer ? (
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

const getState = (status: string, props: any) => {
  switch (status) {
    case 'AWAITING_SEED':
      return <AwaitingSeed />
    case 'AWAITING_PLAYER_ASSIGNMENT':
      return <PlayerAssignment {...props} />
    default:
      return <div>Unknown State: {status}</div>
  }
}

export default function RealtimeUpdates({
  matchId,
  initialStatus = MatchStates[0].slug,
  ...props
}: {
  matchId: string
  initialStatus: string
  higherSeed: boolean | null
  isFirstPlayer: boolean | null
  userId: string
  opponentId: string
}) {
  const [matchStatus, setMatchStatus] = useState(initialStatus)
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: matchId,
    onMessage(event) {
      console.log('msg received:', event.data)
    },
  })

  useEffect(() => {
    function handleEvent(evt: Event) {
      const event = evt as CustomEvent
      console.log('live:update', event.detail)
      socket.send(JSON.stringify(event.detail))
    }
    document.addEventListener('live:update', handleEvent)

    return () => {
      document.removeEventListener('live:update', handleEvent)
    }
  }, [socket])
  const status = MatchStates.find((state) => state.slug === matchStatus)
  if (!status) {
    return null
  }
  const RenderedState = getState(status.slug, props)
  return (
    <div>
      <ul>
        <li>Match ID: {matchId}</li>
        <li>Match Status: {status?.name}</li>
      </ul>
      {RenderedState}
    </div>
  )
}
