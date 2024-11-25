import { getMatch } from '@/lib/inertia'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } },
) {
  const { matchId } = await params
  const cookieStore = await cookies()
  const auth = cookieStore.get('inertia-auth')
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [userId] = auth.value.split(':')

  const matchData = await getMatch(matchId, userId)
  return NextResponse.json(matchData)
}
