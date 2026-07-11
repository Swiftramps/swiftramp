export default function Loading() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fff',
      padding: '24px',
    }}>
      <div style={{
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        border: '2.5px solid #ECE8FE',
        borderTopColor: '#5B3DF5',
        animation: 'spin 0.9s linear infinite',
      }} />
      <p style={{
        fontFamily: "'IBM Plex Sans', sans-serif",
        color: '#6B6960',
        fontSize: '14px',
        marginTop: '20px',
      }}>
        Loading…
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
