'use client'
export default function RateStatus({ loading, stale }: { loading: boolean; stale: boolean }) {
  if (loading) return <div role="status" className="rate-loading">Loading live rates...</div>
  if (stale) return <div role="status" className="rate-warning">Live rates are unavailable. Showing the last known rates.</div>
  return null
}
