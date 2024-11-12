'use client'

import usePartySocket from 'partysocket/react'
import { PARTYKIT_HOST } from '@/app/env'
import { useState } from 'react'
import { MatchStates, RaceModes } from '@/app/config/tournament'

export default function RealtimeUpdates({ matchId }: { matchId: string }) {
  const [matchStatus, setMatchStatus] = useState(MatchStates[0].slug)
  const socket = usePartySocket({
    host: PARTYKIT_HOST,
    room: matchId,
    onMessage(event) {
      console.log('received message:', event.data)
    },
  })
  return (
    <div>
      <h2>Realtime Updates</h2>
      <ul>
        <li>Match ID: {matchId}</li>
        <li>Match Status: {matchStatus}</li>
      </ul>
    </div>
  )
}
