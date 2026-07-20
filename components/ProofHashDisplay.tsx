'use client'

import { useState } from 'react'

interface ProofHashDisplayProps {
  proofHash?: string
  verified?: boolean
  loading?: boolean
  error?: string
}

const CSS = `
  .phd-container {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
    max-width: 100%;
  }

  .phd-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--fill, #F6F6F3);
    border: 1px solid var(--line, #EAEAE6);
    border-radius: 12px;
    padding: 10px 14px;
    gap: 12px;
    width: 100%;
    min-width: 0;
  }

  .phd-hash {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 13px;
    color: var(--ink, #0A0A0A);
    word-break: break-all;
    overflow-wrap: anywhere;
    user-select: all;
    min-width: 0;
    flex: 1;
  }

  .phd-copy-btn {
    background: transparent;
    border: none;
    color: var(--muted, #6B6960);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .phd-copy-btn:hover {
    color: var(--ink, #0A0A0A);
    background: var(--line, #EAEAE6);
  }

  .phd-copy-btn:active {
    transform: scale(0.95);
  }

  .phd-badge-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .phd-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .phd-badge.verified {
    background: var(--accent-soft, #DCE8DE);
    color: var(--accent, #17462B);
  }

  .phd-badge.unverified {
    background: var(--line, #EAEAE6);
    color: var(--muted, #6B6960);
  }

  /* Skeleton loading state */
  .phd-skeleton {
    background: linear-gradient(90deg, #F0F0EE 25%, #E6E6E3 50%, #F0F0EE 75%);
    background-size: 200% 100%;
    animation: phdPulse 1.5s infinite;
  }

  .phd-skeleton-box {
    height: 54px;
    border-radius: 12px;
    width: 100%;
  }

  .phd-skeleton-badge {
    height: 22px;
    width: 80px;
    border-radius: 100px;
  }

  @keyframes phdPulse {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Error state */
  .phd-error {
    color: var(--danger, #B8433A);
    font-size: 13px;
    background: var(--danger-soft, #FBE9E7);
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid var(--danger, #B8433A);
    display: flex;
    align-items: center;
    gap: 8px;
  }
`

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function ShieldCheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function HelpIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function AlertTriangleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

export default function ProofHashDisplay({
  proofHash,
  verified = true,
  loading = false,
  error
}: ProofHashDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!proofHash) return
    try {
      await navigator.clipboard.writeText(proofHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  if (loading) {
    return (
      <div className="phd-container" aria-busy="true" aria-label="Loading proof hash details">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="phd-box phd-skeleton phd-skeleton-box" />
        <div className="phd-badge-row">
          <div className="phd-skeleton phd-skeleton-badge" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="phd-container" role="alert">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />
        <div className="phd-error">
          <AlertTriangleIcon size={16} />
          <span>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="phd-container">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="phd-box">
        <span className="phd-hash" aria-label={`Proof hash: ${proofHash}`}>
          {proofHash}
        </span>
        <button
          className="phd-copy-btn"
          onClick={handleCopy}
          aria-label={copied ? "Copied proof hash" : "Copy proof hash to clipboard"}
          title={copied ? "Copied!" : "Copy"}
        >
          {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
        </button>
      </div>
      <div className="phd-badge-row">
        {verified ? (
          <span className="phd-badge verified" aria-label="Status: Verified on-chain">
            <ShieldCheckIcon size={13} />
            Verified
          </span>
        ) : (
          <span className="phd-badge unverified" aria-label="Status: Unverified on-chain">
            <HelpIcon size={13} />
            Unverified
          </span>
        )}
      </div>
    </div>
  )
}
