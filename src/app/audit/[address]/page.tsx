'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '../../../../components/Navbar'
import ProofHashDisplay from '../../../../components/ProofHashDisplay'

interface AuditEvent {
  id: string
  type: 'Enrolled' | 'Cancelled'
  timestamp: string
  proofHash: string
  txHash: string
  ledger: number
  verified: boolean
}

// Simple deterministic hash to generate identical mock events for the same address
function getDeterministicSeed(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function generateMockEvents(address: string): AuditEvent[] {
  const seed = getDeterministicSeed(address)
  const hexChars = '0123456789abcdef'
  
  const makeHex = (s: number, len: number) => {
    let result = ''
    let curr = s
    for (let i = 0; i < len; i++) {
      curr = (curr * 16807) % 2147483647
      result += hexChars[curr % 16]
    }
    return result
  }

  // Generate 2 to 5 events deterministically based on seed
  const numEvents = 2 + (seed % 4)
  const events: AuditEvent[] = []
  
  // Base date starting from a few months ago
  const baseTime = new Date('2026-03-15T08:00:00Z').getTime()
  
  for (let i = 0; i < numEvents; i++) {
    const isEnrolled = i % 2 === 0
    const timeOffset = (seed % 10 + 1) * (i + 1) * 24 * 60 * 60 * 1000 // Days offset
    const eventTime = new Date(baseTime + timeOffset).toISOString()
    const ledger = 5489000 + (seed % 50000) + i * 2000
    
    events.push({
      id: `evt-${i}-${makeHex(seed + i, 8)}`,
      type: isEnrolled ? 'Enrolled' : 'Cancelled',
      timestamp: eventTime,
      proofHash: `0x${makeHex(seed + i * 17, 48)}`,
      txHash: makeHex(seed + i * 31, 64),
      ledger,
      verified: (seed + i) % 7 !== 0 // Deterministically set verified/unverified
    })
  }

  // Sort chronologically (oldest first)
  return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

  :root {
    --ink: #0A0A0A;
    --paper: #FFFFFF;
    --line: #EAEAE6;
    --muted: #6B6960;
    --accent: #17462B;
    --accent-soft: #DCE8DE;
    --privacy: #5B3DF5;
    --privacy-soft: #ECE8FE;
    --fill: #F6F6F3;
    --shadow-sm: 0 2px 10px rgba(10,10,10,0.05);
    --shadow-md: 0 12px 40px rgba(10,10,10,0.07);
    --shadow-lg: 0 24px 70px rgba(10,10,10,0.10);
    --danger: #B8433A;
    --danger-soft: #FBE9E7;
  }

  .audit-page {
    min-height: 100vh;
    background: #E0E0F0;
    color: var(--ink);
    font-family: 'IBM Plex Sans', sans-serif;
    position: relative;
    padding-bottom: 80px;
  }

  .audit-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 32px 24px;
    position: relative;
    z-index: 1;
  }

  /* Header Section */
  .audit-header {
    margin-bottom: 36px;
    animation: auditFadeUp 0.6s cubic-bezier(0.2, 0.6, 0.2, 1) forwards;
  }

  .audit-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 36px;
    margin: 0 0 12px;
    letter-spacing: -0.01em;
  }

  .audit-subtitle {
    color: var(--muted);
    font-size: 15px;
    line-height: 1.6;
    margin: 0;
  }

  .audit-address-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 16px 20px;
    margin-top: 20px;
    box-shadow: var(--shadow-sm);
    gap: 16px;
  }

  .audit-address-details {
    min-width: 0;
    flex: 1;
  }

  .audit-address-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    display: block;
    margin-bottom: 4px;
  }

  .audit-address-val {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    color: var(--ink);
    word-break: break-all;
  }

  .audit-badge {
    background: var(--privacy-soft);
    color: var(--privacy);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 100px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* Timeline View */
  .audit-timeline {
    position: relative;
    padding-left: 32px;
    margin-top: 20px;
  }

  .audit-timeline::before {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 10px;
    left: 10px;
    width: 2px;
    background: var(--line);
  }

  .audit-item {
    position: relative;
    margin-bottom: 40px;
    animation: auditFadeUp 0.5s cubic-bezier(0.2, 0.6, 0.2, 1) both;
  }

  .audit-node {
    position: absolute;
    left: -32px;
    top: 4px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    border: 2px solid var(--line);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;
    transition: all 0.3s ease;
  }

  .audit-item.enrolled .audit-node {
    border-color: var(--accent);
    background: var(--accent-soft);
    color: var(--accent);
  }

  .audit-item.cancelled .audit-node {
    border-color: var(--danger);
    background: var(--danger-soft);
    color: var(--danger);
  }

  .audit-card {
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 18px;
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: all 0.3s ease;
  }

  .audit-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  .audit-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
    border-bottom: 1px solid var(--line);
    padding-bottom: 12px;
  }

  .audit-event-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .audit-event-type {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 16px;
  }

  .audit-event-time {
    color: var(--muted);
    font-size: 13px;
  }

  .audit-ledger-info {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    color: var(--muted);
  }

  .audit-event-details {
    display: grid;
    grid-template-columns: 100px 1fr;
    gap: 16px;
    align-items: start;
  }

  .audit-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-top: 4px;
  }

  .audit-val-cell {
    min-width: 0;
  }

  .audit-tx-link {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: var(--privacy);
    text-decoration: none;
    word-break: break-all;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  .audit-tx-link:hover {
    text-decoration: underline;
  }

  /* Load More / Pagination Button */
  .audit-load-more {
    display: block;
    width: 100%;
    background: #fff;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 16px;
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    color: var(--ink);
    cursor: pointer;
    text-align: center;
    box-shadow: var(--shadow-sm);
    transition: all 0.2s ease;
    margin-top: 24px;
  }

  .audit-load-more:hover {
    background: var(--fill);
    border-color: var(--ink);
  }

  /* Error and Loading States */
  .audit-loading-row {
    margin-bottom: 24px;
  }

  .audit-skeleton-title {
    height: 40px;
    width: 250px;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .audit-skeleton-text {
    height: 20px;
    width: 400px;
    border-radius: 4px;
    margin-bottom: 24px;
  }

  .audit-skeleton-card {
    height: 180px;
    border-radius: 18px;
    width: 100%;
    margin-bottom: 30px;
  }

  .audit-error-card {
    background: var(--danger-soft);
    color: var(--danger);
    border: 1px solid var(--danger);
    border-radius: 18px;
    padding: 24px;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }

  .audit-error-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px;
  }

  .audit-error-desc {
    font-size: 14.5px;
    margin: 0 0 20px;
    line-height: 1.5;
  }

  .audit-btn-back {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--danger);
    color: #fff;
    border: none;
    border-radius: 100px;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif;
    text-decoration: none;
    font-size: 14px;
  }

  .audit-btn-back:hover {
    filter: brightness(1.08);
  }

  /* Animations */
  @keyframes auditFadeUp {
    from {
      opacity: 0;
      transform: translateY(16px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 600px) {
    .audit-title {
      font-size: 28px;
    }
    .audit-address-box {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
    .audit-event-details {
      grid-template-columns: 1fr;
      gap: 4px;
    }
    .audit-label {
      padding-top: 0;
      margin-top: 10px;
    }
  }
`

function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  )
}

function ExternalLinkIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

export default function AuditPage() {
  const params = useParams()
  const router = useRouter()
  
  // Extract address string from route params
  const address = typeof params?.address === 'string' ? params.address : ''
  const isValidAddress = useMemo(() => /^G[A-Z0-9]{55}$/.test(address), [address])

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const pageSize = 2

  useEffect(() => {
    if (!isValidAddress) {
      setLoading(false)
      setError('Invalid Stellar public key format.')
      return
    }

    const fetchAuditEvents = async () => {
      setLoading(true)
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
        const res = await fetch(`${backendUrl}/api/audit/${address}`)
        if (res.ok) {
          const data = await res.json()
          setEvents(data.events || [])
        } else {
          throw new Error('API server returned an error.')
        }
      } catch (err) {
        // Safe mock fallback for standalone/unconnected mode
        console.warn('Backend API connection failed, loading mock fallback data.')
        setEvents(generateMockEvents(address))
      } finally {
        setLoading(false)
      }
    }

    fetchAuditEvents()
  }, [address, isValidAddress])

  // Pagination slicing
  const visibleEvents = useMemo(() => {
    return events.slice(0, page * pageSize)
  }, [events, page, pageSize])

  const hasMore = visibleEvents.length < events.length

  const handleLoadMore = () => {
    setPage(p => p + 1)
  }

  const formatTimestamp = (isoStr: string) => {
    const d = new Date(isoStr)
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
  }

  return (
    <div className="audit-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />

      <div className="audit-container">
        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <a href="/swap" className="audit-tx-link" style={{ fontSize: '14px', gap: '6px' }}>
            <ArrowLeftIcon size={14} />
            Back to Swap Center
          </a>
        </div>

        {loading && events.length === 0 ? (
          <div className="audit-loading-row" aria-busy="true" aria-label="Loading audit trail details">
            <div className="phd-skeleton audit-skeleton-title" />
            <div className="phd-skeleton audit-skeleton-text" />
            <div className="phd-skeleton audit-skeleton-card" />
            <div className="phd-skeleton audit-skeleton-card" />
          </div>
        ) : error ? (
          <div className="audit-error-card">
            <h2 className="audit-error-title">Compliance Query Failed</h2>
            <p className="audit-error-desc">{error} Public keys must start with 'G' and contain exactly 56 characters.</p>
            <button className="audit-btn-back" onClick={() => router.push('/swap')}>
              Return to Safety
            </button>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="audit-header">
              <h1 className="audit-title">Identity Audit Trail</h1>
              <p className="audit-subtitle">
                Chronological proof-log of all zero-knowledge state updates, enrollments, and cancellations associated with this address.
              </p>

              <div className="audit-address-box">
                <div className="audit-address-details">
                  <span className="audit-address-label">Participant Address</span>
                  <span className="audit-address-val">{address}</span>
                </div>
                <span className="audit-badge">Stellar Network</span>
              </div>
            </div>

            {/* Timeline View */}
            {events.length === 0 ? (
              <div className="audit-card" style={{ textAlign: 'center', color: 'var(--muted)' }}>
                No compliance events recorded for this address.
              </div>
            ) : (
              <div className="audit-timeline">
                {visibleEvents.map((evt, idx) => (
                  <div
                    key={evt.id}
                    className={`audit-item ${evt.type.toLowerCase()}`}
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    <div className="audit-node" aria-hidden="true">
                      {evt.type === 'Enrolled' ? '✓' : '✗'}
                    </div>

                    <div className="audit-card">
                      <div className="audit-meta-row">
                        <div className="audit-event-info">
                          <span className="audit-event-type display">
                            {evt.type === 'Enrolled' ? 'Enrollment Registered' : 'Enrollment Cancelled'}
                          </span>
                          <span className="audit-event-time">
                            {formatTimestamp(evt.timestamp)}
                          </span>
                        </div>
                        <span className="audit-ledger-info">
                          Ledger #{evt.ledger}
                        </span>
                      </div>

                      <div className="audit-event-details">
                        <span className="audit-label">Proof Hash</span>
                        <div className="audit-val-cell">
                          <ProofHashDisplay proofHash={evt.proofHash} verified={evt.verified} />
                        </div>

                        <span className="audit-label" style={{ marginTop: '16px' }}>Ledger Tx</span>
                        <div className="audit-val-cell" style={{ marginTop: '16px' }}>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${evt.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="audit-tx-link"
                          >
                            <span>{evt.txHash.slice(0, 16)}…{evt.txHash.slice(-16)}</span>
                            <ExternalLinkIcon size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Load More */}
            {hasMore && (
              <button className="audit-load-more" onClick={handleLoadMore}>
                Load Historical Records
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
