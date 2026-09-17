import Link from 'next/link'

export default function Home() {
  return (
    <main style={{ padding: '3rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ marginBottom: '0.5rem' }}>STARC CMS</h1>
      <p style={{ color: '#666', marginBottom: '2rem' }}>
        Backend de gestion de contenu pour STARC Enterprise.
      </p>
      <Link
        href="/admin"
        style={{
          display: 'inline-block',
          padding: '0.75rem 1.5rem',
          background: '#3B9AE1',
          color: 'white',
          borderRadius: '8px',
          textDecoration: 'none',
          fontWeight: 600,
        }}
      >
        → Panneau d'administration
      </Link>
    </main>
  )
}
