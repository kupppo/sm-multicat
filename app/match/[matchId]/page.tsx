import { notFound } from 'next/navigation'
import RealtimeUpdates from './realtime'
import { cookies } from 'next/headers'

export default async function MatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>
}) {
  const { matchId } = await params

  // check auth
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('inertia-auth')
  if (!authCookie) {
    return notFound()
  }

  const inertiaUrl = process.env.INERTIA_URL
  const inertiaToken = process.env.INERTIA_TOKEN
  const tournamentSlug = process.env.TOURNAMENT_SLUG
  const matchReq = await fetch(
    `${inertiaUrl}/api/tournaments/${tournamentSlug}/matches/${matchId}`,
    {
      headers: {
        authorization: `Bearer ${inertiaToken}`,
      },
    },
  )
  const match = await matchReq.json()

  if (!match) {
    return notFound()
  }

  const [userId, _token] = authCookie.value.split(':')
  const userReq = await fetch(
    `${inertiaUrl}/api/tournaments/${tournamentSlug}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${inertiaToken}`,
      },
    },
  )

  if (!userReq) {
    return notFound()
  }

  const user = await userReq.json()

  const statusMetafield = match.metafields.find((m: any) => m.key === 'status')
  const higherSeed = match.metafields.find((m: any) => m.key === 'higher_seed')
  const firstPlayer = match.metafields.find((m: any) => m.key === 'player_1')
  const opponentId = match.racers.find((r: any) => r.id !== user.id).id

  return (
    <div>
      <h1>{match.races[0].name}</h1>
      <RealtimeUpdates
        matchId={matchId}
        initialStatus={statusMetafield.value}
        higherSeed={higherSeed?.value || null}
        isFirstPlayer={firstPlayer?.value === user.id || null}
        userId={user.id}
        opponentId={opponentId}
      />
    </div>
  )
}
