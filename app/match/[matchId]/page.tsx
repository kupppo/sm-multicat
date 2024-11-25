import { notFound } from 'next/navigation'
import RealtimeUpdates from './realtime'
import { cookies } from 'next/headers'
import InertiaAPI from '@/lib/inertia'

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

  const tournamentSlug = process.env.TOURNAMENT_SLUG
  const match = await InertiaAPI(
    `/api/tournaments/${tournamentSlug}/matches/${matchId}`,
    {
      method: 'GET',
    },
  )

  if (!match) {
    return notFound()
  }

  const [userId, _token] = authCookie.value.split(':')
  const user = await InertiaAPI(
    `/api/tournaments/${tournamentSlug}/users/${userId}`,
    {
      method: 'GET',
    },
  )

  if (!user) {
    return notFound()
  }

  return (
    <div>
      <h1>{match.races[0].name}</h1>
      <RealtimeUpdates matchId={matchId} {...match} />
    </div>
  )
}
