import Link from 'next/link'

export default function Home() {
  return (
    <div>
      <h1>Super Metroid Multi-Category Tournament 2024</h1>
      <ul>
        <li>
          <Link href="#">Standings</Link>
        </li>
        <li>
          <Link href="https://sg-schedule.inertia.run/smmc">Schedule</Link>
        </li>
      </ul>
    </div>
  )
}
