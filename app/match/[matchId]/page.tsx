import { notFound } from 'next/navigation'
import RealtimeUpdates from './realtime'
import { cookies } from 'next/headers'
import InertiaAPI, { parseMatchData } from '@/lib/inertia'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

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

  const initialData = parseMatchData(match, user)

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full mx-4 md:mx-0 md:w-1/2 max-w-[480px]">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            <h1>{match.races[0].name}</h1>
          </CardTitle>
        </CardHeader>
        <RealtimeUpdates {...initialData} />
      </Card>
    </div>
  )
}
