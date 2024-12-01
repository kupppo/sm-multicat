import InertiaAPI from '@/lib/inertia'
import { notFound } from 'next/navigation'

export default async function LoginPage() {
  const tournamentSlug = process.env.TOURNAMENT_SLUG
  const users = await InertiaAPI(`/api/tournaments/${tournamentSlug}/users`, {
    method: 'GET',
  })
  if (!users) {
    return notFound()
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center w-full md:w-1/2 max-w-[500px] mx-auto px-4 text-center gap-y-8">
      <ul>
        {users.map((user: any) => (
          <li key={user.id}>
            {user.name}
          </li>
        ))}
      </ul>
    </div>
  )
}
