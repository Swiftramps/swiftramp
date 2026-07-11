import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'IBM Plex Sans', sans-serif",
      background: '#fff',
      color: '#0A0A0A',
      padding: '24px',
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '96px',
        fontWeight: 700,
        lineHeight: 1,
        color: '#5B3DF5',
        marginBottom: '8px',
      }}>
        404
      </div>
      <h1 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '28px',
        fontWeight: 600,
        margin: '0 0 12px',
      }}>
        Page not found
      </h1>
      <p style={{
        color: '#6B6960',
        fontSize: '15px',
        lineHeight: 1.6,
        maxWidth: '400px',
        margin: '0 0 32px',
      }}>
        This route doesn&apos;t exist. The link may be broken or the page may
        have moved.
      </p>
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: '#0A0A0A',
          color: '#fff',
          border: 'none',
          borderRadius: '100px',
          padding: '14px 28px',
          fontWeight: 600,
          fontSize: '14.5px',
          cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          textDecoration: 'none',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        Go home →
      </Link>
    </div>
  )
}
