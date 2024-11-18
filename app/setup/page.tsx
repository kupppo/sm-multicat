import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

export default async function RunnerSetup() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('inertia-auth')
  if (!auth) {
    return notFound()
  }

  const [userId, token] = auth.value.split(':')

  const inertiaUrl = process.env.INERTIA_URL
  const tournamentSlug = process.env.TOURNAMENT_SLUG
  const inertiaToken = process.env.INERTIA_TOKEN
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
  const authMetafield = user.metafields.find(
    (metafield: any) => metafield.key === 'authToken',
  )
  if (!authMetafield || authMetafield.value !== token) {
    return notFound()
  }

  return <div>setup: {user.name}</div>
}
