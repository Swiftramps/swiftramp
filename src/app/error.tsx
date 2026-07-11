'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
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
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: '#FBE9E7',
        color: '#B8433A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '26px',
        fontWeight: 700,
        margin: '0 auto 20px',
      }}>
        !
      </div>
      <h1 style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '26px',
        fontWeight: 600,
        margin: '0 0 12px',
      }}>
        Something went wrong
      </h1>
      <p style={{
        color: '#6B6960',
        fontSize: '15px',
        lineHeight: 1.6,
        maxWidth: '420px',
        margin: '0 0 8px',
      }}>
        An unexpected error occurred. Please try again.
      </p>
      {error.digest && (
        <p style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: '11px',
          color: '#6B6960',
          margin: '0 0 28px',
        }}>
          Error ID: {error.digest}
        </p>
      )}
      <button
        onClick={reset}
        style={{
          background: '#0A0A0A',
          color: '#fff',
          border: 'none',
          borderRadius: '100px',
          padding: '14px 28px',
          fontWeight: 600,
          fontSize: '14.5px',
          cursor: 'pointer',
          fontFamily: "'Space Grotesk', sans-serif",
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        Try again
      </button>
    </div>
  )
}
