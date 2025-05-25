import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: '2rem' }}>
      <h1>Willkommen bei Billirae 🚀</h1>
      <p>Deine Rechnungsapp ist bereit!</p>
      <ul>
        <li><Link href="/login">Login-Seite</Link></li>
        <li><Link href="/dashboard">Dashboard</Link></li>
      </ul>
    </main>
  )
}
