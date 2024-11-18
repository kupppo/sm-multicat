import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

type Metafield = {
  key: string
  value: string
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string; userId: string }> },
) {
  const { token, userId } = await params
  const inertiaUrl = process.env.INERTIA_URL
  const tournamentSlug = process.env.TOURNAMENT_SLUG
  const inertiaToken = process.env.INERTIA_TOKEN
  const authReq = await fetch(
    `${inertiaUrl}/api/tournaments/${tournamentSlug}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${inertiaToken}`,
      },
    },
  )
  if (!authReq.ok) {
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }

  const user = await authReq.json()
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const authMetafield = user.metafields.find(
    (metafield: Metafield) => metafield.key === 'authToken',
  )
  if (!authMetafield || authMetafield.value !== token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set('inertia-auth', `${userId}:${token}`, {})

  const redirectUrl = new URL('/setup', req.nextUrl.origin)
  return NextResponse.redirect(redirectUrl.toString())
}
