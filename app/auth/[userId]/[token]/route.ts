import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string; userId: string } },
) {
  // const cookieStore = await cookies()
  // verify cookie against inertia API
  const { token, userId } = await params
  const inertiaUrl = process.env.INERTIA_URL
  const authReq = await fetch(`${inertiaUrl}/api/user/${userId}`)
  const user = await authReq.json()
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  const authMetafield = user.metafields.find((metafield: any) => metafield.key === 'authToken')
  if (!authMetafield || authMetafield.value !== token) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  return NextResponse.json({ user })
}
