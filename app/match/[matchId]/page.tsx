import { notFound } from 'next/navigation'

export default async function MatchPage({
  params,
}: {
  params: { matchId: string }
}) {
  const { matchId } = await params
  const inertiaUrl = process.env.INERTIA_URL
  const matchReq = await fetch(
    `${inertiaUrl}/api/tournaments/smmc24/matches/${matchId}`,
  )
  const match = await matchReq.json()

  if (!match) {
    return notFound()
  }

  return (
    <div>
      <h1>{match.races[0].name}</h1>
    </div>
  )
}
