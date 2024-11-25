import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import InertiaAPI from '@/lib/inertia'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'
import EditSeedForm from './form'

export default async function AdminPage() {
  const cookieStore = await cookies()
  const authCookie = cookieStore.get('inertia-auth')
  if (!authCookie) {
    return notFound()
  }

  const [userId, _token] = authCookie.value.split(':')
  const ADMINS = process.env.ADMINS!.split(',')
  if (!ADMINS.includes(userId)) {
    return notFound()
  }

  const tournamentSlug = process.env.TOURNAMENT_SLUG
  const allMatches = await InertiaAPI(
    `/api/tournaments/${tournamentSlug}/matches`,
    {
      method: 'GET',
    },
  )

  const pendingMatches = allMatches.filter(
    (match: any) => match.status === 'PENDING',
  )
  const matches = await Promise.all(
    pendingMatches.map(async (match: any) => {
      const matchData = await InertiaAPI(
        `/api/tournaments/${tournamentSlug}/matches/${match.id}`,
        {
          method: 'GET',
        },
      )
      const higherSeed =
        matchData.metafields.find((m: any) => m.key === 'higher_seed')?.value ||
        null
      return { ...matchData, higherSeed }
    }),
  )

  return (
    <div>
      <h1>Admin Page</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Higher Seed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match: any) => {
            const higherSeed = match.racers.find(
              (r: any) => r.id === match.higherSeed,
            )?.user.name
            return (
              <TableRow key={match.id}>
                <TableCell className="font-mono">
                  <Link href={`/match/${match.id}`}>{match.id}</Link>
                </TableCell>
                <TableCell>{match.races[0].name}</TableCell>
                <TableCell className="font-mono">{match.status}</TableCell>
                <TableCell className="font-mono">
                  <EditSeedForm
                    name={higherSeed}
                    racers={match.racers}
                    matchId={match.id}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
