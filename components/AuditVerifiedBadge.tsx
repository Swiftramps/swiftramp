'use client'
import { useState, useEffect, useCallback } from 'react'

type VerificationStatus = 'verified' | 'unverified' | 'unknown'

interface VerifyApiResponse {
  status: VerificationStatus
  proof_hash: string
  verified_at: string | null
  message: string
}

interface AuditVerifiedBadgeProps {
  proofHash: string
}

const BADGE_CSS = `
  .avb-wrap {
    display: inline-flex; flex-direction: column; align-items: center; gap: 8px;
    margin-bottom: 20px;
  }
  .avb-badge {
    display: inline-flex; align-items: center; gap: 6px;
    border-radius: 100px; padding: 6px 14px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600;
    transition: background 0.3s ease, color 0.3s ease;
  }
  .avb-badge.verified {
    background: var(--sw-mint-soft, #DCE8DE); color: var(--sw-mint, #17462B);
  }
  .avb-badge.unverified {
    background: #FCE8E6; color: #B8433A;
  }
  .avb-badge.unknown {
    background: var(--sw-fill, #F6F6F3); color: var(--sw-muted, #6B6960);
  }
  .avb-reverify {
    background: none; border: 1px solid var(--sw-line, #EAEAE6);
    border-radius: 100px; padding: 4px 12px;
    font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600;
    color: var(--sw-muted, #6B6960); cursor: pointer;
    display: inline-flex; align-items: center; gap: 4px;
    transition: border-color 0.2s ease, color 0.2s ease;
  }
  .avb-reverify:hover { border-color: var(--sw-violet, #5B3DF5); color: var(--sw-violet, #5B3DF5); }
  .avb-reverify:disabled { opacity: 0.5; cursor: not-allowed; }
  .avb-reverify-spin {
    width: 10px; height: 10px; border-radius: 50%;
    border: 1.5px solid var(--sw-line, #EAEAE6); border-top-color: var(--sw-violet, #5B3DF5);
    animation: avbRotate 0.8s linear infinite;
  }
  @keyframes avbRotate { to { transform: rotate(360deg); } }
`

function VerifiedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 12l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function UnverifiedIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function UnknownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.5 9.5a2.5 2.5 0 113 2.45V13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.5" r="0.8" fill="currentColor" />
    </svg>
  )
}

function RefreshIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
      <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AuditVerifiedBadge({ proofHash }: AuditVerifiedBadgeProps) {
  const [status, setStatus] = useState<VerificationStatus>('unknown')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null)

  const fetchVerification = useCallback(async () => {
    if (!proofHash) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/enrollments/${proofHash}/verify`)
      if (!res.ok) throw new Error(`Verification failed (${res.status})`)
      const data: VerifyApiResponse = await res.json()
      setStatus(data.status)
      setVerifiedAt(data.verified_at)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('unknown')
    } finally {
      setLoading(false)
    }
  }, [proofHash])

  useEffect(() => {
    fetchVerification()
  }, [fetchVerification])

  const icon =
    status === 'verified' ? <VerifiedIcon /> :
    status === 'unverified' ? <UnverifiedIcon /> :
    <UnknownIcon />

  const label =
    loading ? 'Verifying…' :
    status === 'verified' ? 'Enrollment verified' :
    status === 'unverified' ? 'Unverified' :
    error ? 'Verification error' :
    'Unknown status'

  const statusClass = loading ? 'unknown' : status

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BADGE_CSS }} />
      <div className="avb-wrap">
        <div className={`avb-badge ${statusClass}`}>
          {icon} {label}
        </div>
        <button
          className="avb-reverify"
          onClick={fetchVerification}
          disabled={loading}
          aria-label="Re-verify enrollment"
        >
          {loading ? <span className="avb-reverify-spin" /> : <RefreshIcon />}
          {loading ? 'Verifying…' : 'Re-verify'}
        </button>
        {verifiedAt && status === 'verified' && (
          <span style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: '9px',
            color: 'var(--sw-muted, #6B6960)',
            opacity: 0.6,
          }}>
            Verified {new Date(verifiedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </>
  )
}
