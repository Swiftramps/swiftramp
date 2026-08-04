'use client'
import React from 'react'

interface EnrollmentDetailCardProps {
  address: string
  proofHash: string
  queueId?: string
  timestamp?: string
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

  .edc-card {
    background: #FFFFFF;
    border: 1px solid #EAEAE6;
    border-radius: 16px;
    padding: 20px;
    box-shadow: 0 8px 30px rgba(10,10,10,0.06);
    font-family: 'IBM Plex Sans', sans-serif;
    color: #0A0A0A;
    text-align: left;
    box-sizing: border-box;
  }
  .edc-card * { box-sizing: border-box; }

  .edc-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 16px;
  }

  .edc-title {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 16px;
    font-weight: 700;
    margin: 0;
  }

  .edc-badge {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    background: #DCE8DE;
    color: #17462B;
    padding: 4px 10px;
    border-radius: 100px;
    white-space: nowrap;
  }

  .edc-grid {
    display: grid;
    gap: 14px;
    margin: 0;
  }

  .edc-field {
    display: grid;
    gap: 4px;
  }

  .edc-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: #6B6960;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0;
  }

  .edc-value {
    font-size: 13.5px;
    line-height: 1.5;
    word-break: break-all;
    margin: 0;
  }

  .edc-hash {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px;
    background: #ECE8FE;
    color: #5B3DF5;
    border: 1px solid transparent;
    border-radius: 10px;
    padding: 10px 12px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    transition: border-color 0.2s ease;
  }

  .edc-hash:hover,
  .edc-hash:focus-visible {
    border-color: #5B3DF5;
    outline: none;
  }

  .edc-hash-text {
    word-break: break-all;
    flex: 1;
    min-width: 0;
  }

  .edc-copy {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 9.5px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }

  .edc-copy-idle { color: #5B3DF5; }
  .edc-copy-done { color: #17462B; }

  @media (max-width: 600px) {
    .edc-card { padding: 16px; }
    .edc-header { flex-direction: column; align-items: flex-start; }
  }
`

export default function EnrollmentDetailCard({
  address,
  proofHash,
  queueId,
  timestamp,
}: EnrollmentDetailCardProps) {
  const [copied, setCopied] = React.useState(false)
  const hash = proofHash.replace(/^0x/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(hash)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="edc-card" data-testid="enrollment-detail-card">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="edc-header">
        <h3 className="edc-title">Enrollment Detail</h3>
        <span className="edc-badge">Committed</span>
      </div>
      <dl className="edc-grid">
        <div className="edc-field">
          <dt className="edc-label">Proof Hash</dt>
          <dd
            className="edc-value edc-hash"
            onClick={handleCopy}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleCopy()
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Copy proof hash"
            title="Click to copy proof hash"
          >
            <span className="edc-hash-text">{hash}</span>
            <span className={`edc-copy ${copied ? 'edc-copy-done' : 'edc-copy-idle'}`}>
              {copied ? '✓ Copied' : 'Copy'}
            </span>
          </dd>
        </div>
        <div className="edc-field">
          <dt className="edc-label">Identity</dt>
          <dd className="edc-value">{address}</dd>
        </div>
        {queueId && (
          <div className="edc-field">
            <dt className="edc-label">Queue</dt>
            <dd className="edc-value">{queueId}</dd>
          </div>
        )}
        {timestamp && (
          <div className="edc-field">
            <dt className="edc-label">Enrolled At</dt>
            <dd className="edc-value">{timestamp}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
