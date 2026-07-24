'use client'

import { useState, useEffect, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────────

interface CancelledEvent {
  hash: string
  txHash: string
  ledger: number
  timestamp: string
  verified: boolean
}

interface CancelEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  proofHash?: string
  walletAddress: string
  onSuccess?: (event: CancelledEvent) => void
}

type ModalStage = 'info' | 'submitting' | 'success' | 'error'

// ── Helpers ────────────────────────────────────────────────────────────

const HEX_CHARS = '0123456789abcdef'
function randomHex(len: number) {
  let s = ''
  for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)]
  return s
}

function truncate(addr: string) {
  if (addr.length <= 10) return addr
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatTimestamp(isoStr: string) {
  const d = new Date(isoStr)
  return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
}

// ── SVG Icons ──────────────────────────────────────────────────────────

function AlertTriangleIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ShieldIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M12 2L4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3z" />
      <path d="M9 12l2 2 4-4.5" strokeLinecap="round" />
    </svg>
  )
}

function CheckCircleIcon({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="16 8 10 16 7 13" />
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

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

// ── CSS ────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

  /* Overlay */
  .cem-overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 10, 0.55);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 24px;
    animation: cemFadeIn 0.2s ease;
  }

  @keyframes cemFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .cem-modal {
    background: #fff;
    border-radius: 22px;
    width: 100%;
    max-width: 480px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 30px 90px rgba(10, 10, 10, 0.2);
    animation: cemSlideUp 0.3s cubic-bezier(0.2, 0.6, 0.2, 1);
    position: relative;
  }

  @keyframes cemSlideUp {
    from { opacity: 0; transform: translateY(30px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .cem-close {
    position: absolute;
    top: 14px;
    right: 14px;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    background: var(--fill, #F6F6F3);
    color: var(--muted, #6B6960);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    font-size: 16px;
    z-index: 2;
  }

  .cem-close:hover {
    background: var(--line, #EAEAE6);
    color: var(--ink, #0A0A0A);
  }

  .cem-body {
    padding: 32px;
  }

  /* Header */
  .cem-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
    padding-right: 24px;
  }

  .cem-header-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--danger-soft, #FBE9E7);
    color: var(--danger, #B8433A);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .cem-header h2 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin: 0;
    color: var(--ink, #0A0A0A);
  }

  .cem-header p {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px;
    color: var(--muted, #6B6960);
    margin: 2px 0 0;
    line-height: 1.4;
  }

  /* Address badge */
  .cem-address-box {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--fill, #F6F6F3);
    border: 1px solid var(--line, #EAEAE6);
    border-radius: 100px;
    padding: 8px 14px;
    margin-bottom: 20px;
  }

  .cem-address-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--danger, #B8433A);
    flex-shrink: 0;
  }

  .cem-address-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--muted, #6B6960);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cem-address-val {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--ink, #0A0A0A);
    font-weight: 600;
    word-break: break-all;
    flex: 1;
  }

  /* Proof hash display */
  .cem-proof-section {
    margin-bottom: 20px;
  }

  .cem-proof-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 600;
    color: var(--muted, #6B6960);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 6px;
    display: block;
  }

  .cem-proof-box {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--privacy-soft, #ECE8FE);
    border: 1px solid var(--privacy, #5B3DF5);
    border-radius: 12px;
    padding: 10px 14px;
    gap: 10px;
  }

  .cem-proof-hash {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--privacy, #5B3DF5);
    word-break: break-all;
    overflow-wrap: anywhere;
    user-select: all;
    flex: 1;
    min-width: 0;
  }

  .cem-proof-copy {
    background: transparent;
    border: none;
    color: var(--privacy, #5B3DF5);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .cem-proof-copy:hover {
    background: rgba(91, 61, 245, 0.1);
  }

  /* Audit preservation copy */
  .cem-audit-notice {
    background: var(--fill, #F6F6F3);
    border: 1px solid var(--line, #EAEAE6);
    border-radius: 12px;
    padding: 14px 16px;
    margin-bottom: 20px;
  }

  .cem-audit-notice-title {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink, #0A0A0A);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .cem-audit-notice p {
    font-size: 12.5px;
    color: var(--muted, #6B6960);
    line-height: 1.55;
    margin: 0;
  }

  .cem-audit-notice strong {
    color: var(--ink, #0A0A0A);
    font-weight: 600;
  }

  /* Confirmation checkbox */
  .cem-confirm-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 20px;
    padding: 12px 14px;
    background: var(--danger-soft, #FBE9E7);
    border: 1px solid rgba(184, 67, 58, 0.25);
    border-radius: 12px;
  }

  .cem-confirm-checkbox {
    width: 18px;
    height: 18px;
    min-width: 18px;
    border: 1.5px solid var(--danger, #B8433A);
    border-radius: 4px;
    cursor: pointer;
    accent-color: var(--danger, #B8433A);
    margin-top: 1px;
  }

  .cem-confirm-label {
    font-size: 13px;
    color: var(--ink, #0A0A0A);
    line-height: 1.5;
    cursor: pointer;
    font-weight: 500;
  }

  .cem-confirm-label strong {
    color: var(--danger, #B8433A);
  }

  /* Buttons */
  .cem-btn-primary {
    width: 100%;
    background: var(--danger, #B8433A);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 15px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
  }

  .cem-btn-primary:hover:not(:disabled) {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(184, 67, 58, 0.3);
  }

  .cem-btn-primary:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  .cem-btn-secondary {
    width: 100%;
    background: transparent;
    color: var(--muted, #6B6960);
    border: 1.5px solid var(--line, #EAEAE6);
    border-radius: 100px;
    padding: 12px;
    font-weight: 600;
    font-size: 13.5px;
    cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif;
    margin-top: 10px;
    transition: all 0.2s ease;
  }

  .cem-btn-secondary:hover {
    border-color: var(--ink, #0A0A0A);
    color: var(--ink, #0A0A0A);
  }

  /* Loading state */
  .cem-spinner {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 3px solid var(--danger-soft, #FBE9E7);
    border-top-color: var(--danger, #B8433A);
    animation: cemRotate 0.85s linear infinite;
    margin: 0 auto 18px;
  }

  @keyframes cemRotate {
    to { transform: rotate(360deg); }
  }

  .cem-submitting {
    text-align: center;
    padding: 20px 0;
  }

  .cem-submitting h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--ink, #0A0A0A);
  }

  .cem-submitting p {
    font-size: 13.5px;
    color: var(--muted, #6B6960);
    margin: 0 0 4px;
  }

  .cem-progress-wrap {
    margin-top: 20px;
    text-align: left;
  }

  .cem-progress-step {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 0;
    opacity: 0.35;
    transition: opacity 0.3s ease;
  }

  .cem-progress-step.active {
    opacity: 1;
  }

  .cem-progress-step.done {
    opacity: 0.8;
  }

  .cem-progress-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--line, #EAEAE6);
    flex-shrink: 0;
    transition: all 0.3s ease;
  }

  .cem-progress-step.active .cem-progress-dot {
    background: var(--danger, #B8433A);
    box-shadow: 0 0 0 4px rgba(184, 67, 58, 0.15);
    animation: cemPulse 1s ease-in-out infinite;
  }

  .cem-progress-step.done .cem-progress-dot {
    background: var(--danger, #B8433A);
  }

  @keyframes cemPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .cem-progress-label {
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--ink, #0A0A0A);
  }

  .cem-progress-sub {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    color: var(--muted, #6B6960);
    margin-top: 1px;
  }

  /* Success state */
  .cem-success {
    text-align: center;
    padding: 10px 0;
  }

  .cem-success-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--danger-soft, #FBE9E7);
    color: var(--danger, #B8433A);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
    animation: cemPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  @keyframes cemPop {
    0% { transform: scale(0.5); opacity: 0; }
    100% { transform: scale(1); opacity: 1; }
  }

  .cem-success h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 22px;
    font-weight: 700;
    margin: 0 0 6px;
    color: var(--ink, #0A0A0A);
  }

  .cem-success p.desc {
    color: var(--muted, #6B6960);
    font-size: 14px;
    margin: 0 0 20px;
    line-height: 1.5;
  }

  .cem-event-card {
    background: var(--fill, #F6F6F3);
    border: 1px solid var(--line, #EAEAE6);
    border-radius: 14px;
    padding: 16px;
    margin-bottom: 18px;
    text-align: left;
  }

  .cem-event-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid var(--line, #EAEAE6);
    gap: 12px;
  }

  .cem-event-row:last-child {
    border-bottom: none;
  }

  .cem-event-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 600;
    color: var(--muted, #6B6960);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    white-space: nowrap;
  }

  .cem-event-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    color: var(--ink, #0A0A0A);
    font-weight: 600;
    word-break: break-all;
    text-align: right;
    min-width: 0;
  }

  .cem-event-hash {
    color: var(--privacy, #5B3DF5);
    word-break: break-all;
    font-size: 11px;
  }

  .cem-event-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: var(--danger-soft, #FBE9E7);
    color: var(--danger, #B8433A);
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .cem-success-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cem-btn-success {
    width: 100%;
    background: var(--ink, #0A0A0A);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 14px;
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    font-family: 'Space Grotesk', sans-serif;
    letter-spacing: 0.01em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .cem-btn-success:hover {
    filter: brightness(1.08);
    transform: translateY(-1px);
    box-shadow: 0 8px 24px rgba(10, 10, 10, 0.2);
  }

  /* Error state */
  .cem-error {
    text-align: center;
    padding: 10px 0;
  }

  .cem-error-icon {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--danger-soft, #FBE9E7);
    color: var(--danger, #B8433A);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .cem-error h3 {
    font-family: 'Space Grotesk', sans-serif;
    font-size: 20px;
    font-weight: 700;
    margin: 0 0 8px;
    color: var(--ink, #0A0A0A);
  }

  .cem-error-msg {
    background: var(--danger-soft, #FBE9E7);
    color: var(--danger, #B8433A);
    border: 1px solid var(--danger, #B8433A);
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 13px;
    margin-bottom: 20px;
    text-align: left;
    line-height: 1.5;
  }

  /* Divider */
  .cem-divider {
    height: 1px;
    background: var(--line, #EAEAE6);
    margin: 20px 0;
  }

  /* Responsive */
  @media (max-width: 500px) {
    .cem-body {
      padding: 24px 20px;
    }
  }
`

// ── Component ──────────────────────────────────────────────────────────

export default function CancelEnrollmentModal({
  isOpen,
  onClose,
  proofHash: externalProofHash,
  walletAddress,
  onSuccess,
}: CancelEnrollmentModalProps) {
  const [stage, setStage] = useState<ModalStage>('info')
  const [confirmed, setConfirmed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [proofHash, setProofHash] = useState(externalProofHash || '')
  const [progressIdx, setProgressIdx] = useState(-1)
  const [successEvent, setSuccessEvent] = useState<CancelledEvent | null>(null)

  // Generate proof hash if not provided externally
  useEffect(() => {
    if (isOpen && !proofHash) {
      setProofHash(randomHex(48))
    }
  }, [isOpen, proofHash])

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Reset after animation completes
      const t = setTimeout(() => {
        setStage('info')
        setConfirmed(false)
        setCopied(false)
        setErrorMsg('')
        setProgressIdx(-1)
        setSuccessEvent(null)
      }, 200)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  const handleCopyProof = useCallback(async () => {
    if (!proofHash) return
    try {
      await navigator.clipboard.writeText(`0x${proofHash}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }, [proofHash])

  const handleSubmit = useCallback(async () => {
    if (!confirmed) return

    setStage('submitting')
    setProgressIdx(0)

    // Simulate cancellation submission with staged progress
    const steps = [
      { delay: 500, idx: 0 },   // Preparing cancellation proof
      { delay: 1200, idx: 1 },  // Submitting on-chain
      { delay: 2000, idx: 2 },  // Confirming cancellation
    ]

    for (const step of steps) {
      await new Promise(r => setTimeout(r, step.delay))
      setProgressIdx(step.idx)
    }

    // Simulate success (95% chance) or error (5% chance)
    const isError = Math.random() < 0.05
    if (isError) {
      setErrorMsg('The on-chain submission failed due to a network timeout. The transaction may have been reverted. Please try again.')
      setStage('error')
      return
    }

    // Generate cancelled event data
    const event: CancelledEvent = {
      hash: `0x${proofHash}`,
      txHash: randomHex(64),
      ledger: 5489000 + Math.floor(Math.random() * 50000),
      timestamp: new Date().toISOString(),
      verified: true,
    }

    setSuccessEvent(event)
    setStage('success')

    if (onSuccess) {
      onSuccess(event)
    }
  }, [confirmed, proofHash, onSuccess])

  const handleRetry = useCallback(() => {
    setStage('info')
    setConfirmed(false)
    setErrorMsg('')
    setProgressIdx(-1)
  }, [])

  if (!isOpen) return null

  const PROGRESS_STEPS = [
    { label: 'Preparing cancellation proof', sub: 'Generating zk-SNARK for cancellation event' },
    { label: 'Submitting on-chain', sub: 'Broadcasting to Stellar network' },
    { label: 'Confirming cancellation', sub: 'Waiting for ledger finality' },
  ]

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cem-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-label="Cancel enrollment modal">
        <div className="cem-modal">
          <button className="cem-close" onClick={onClose} aria-label="Close modal">
            ✕
          </button>

          <div className="cem-body">
            {/* ── Info / Confirmation Stage ── */}
            {stage === 'info' && (
              <>
                <div className="cem-header">
                  <div className="cem-header-icon">
                    <AlertTriangleIcon size={20} />
                  </div>
                  <div>
                    <h2>Cancel Enrollment</h2>
                    <p>This action cannot be undone — the audit trail will be preserved permanently on-chain.</p>
                  </div>
                </div>

                {/* Wallet Address */}
                <div className="cem-address-box">
                  <span className="cem-address-dot" />
                  <span className="cem-address-label">Enrollment</span>
                  <span className="cem-address-val" title={walletAddress}>
                    {truncate(walletAddress)}
                  </span>
                </div>

                {/* Proof Hash */}
                <div className="cem-proof-section">
                  <span className="cem-proof-label">Proof Hash Being Submitted</span>
                  <div className="cem-proof-box">
                    <span className="cem-proof-hash">0x{proofHash}</span>
                    <button
                      className="cem-proof-copy"
                      onClick={handleCopyProof}
                      aria-label={copied ? 'Copied proof hash' : 'Copy proof hash'}
                      title={copied ? 'Copied!' : 'Copy'}
                    >
                      {copied ? '✓' : <CopyIcon size={16} />}
                    </button>
                  </div>
                </div>

                {/* Audit Preservation Notice */}
                <div className="cem-audit-notice">
                  <div className="cem-audit-notice-title">
                    <ShieldIcon size={14} />
                    Audit Trail Preservation
                  </div>
                  <p>
                    This cancellation will be permanently recorded on the Stellar ledger as a <strong>Cancelled</strong> event.
                    The proof hash <strong>0x{proofHash?.slice(0, 12)}…{proofHash?.slice(-8)}</strong> will be stored alongside
                    the transaction, ensuring the full audit trail remains verifiable indefinitely.
                    <br /><br />
                    Once submitted, <strong>this enrollment cannot be restored</strong>. A new enrollment would need to be
                    created from scratch.
                  </p>
                </div>

                {/* Confirmation Checkbox */}
                <div className="cem-confirm-row">
                  <input
                    type="checkbox"
                    id="cem-confirm"
                    className="cem-confirm-checkbox"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <label htmlFor="cem-confirm" className="cem-confirm-label">
                    I understand that this cancellation will create a permanent <strong>Cancelled</strong> event on-chain
                    and the enrollment <strong>cannot be restored</strong>.
                  </label>
                </div>

                <button
                  className="cem-btn-primary"
                  disabled={!confirmed}
                  onClick={handleSubmit}
                >
                  <AlertTriangleIcon size={16} />
                  Cancel Enrollment
                </button>

                <button className="cem-btn-secondary" onClick={onClose}>
                  Dismiss
                </button>
              </>
            )}

            {/* ── Submitting / Loading Stage ── */}
            {stage === 'submitting' && (
              <div className="cem-submitting">
                <div className="cem-spinner" />
                <h3>Submitting Cancellation</h3>
                <p>Broadcasting the cancellation proof to the Stellar network.</p>

                <div className="cem-progress-wrap">
                  {PROGRESS_STEPS.map((step, i) => (
                    <div
                      key={step.label}
                      className={`cem-progress-step ${i < progressIdx ? 'done' : i === progressIdx ? 'active' : ''}`}
                    >
                      <div className="cem-progress-dot" />
                      <div>
                        <div className="cem-progress-label">{step.label}</div>
                        <div className="cem-progress-sub">{step.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Success Stage ── */}
            {stage === 'success' && successEvent && (
              <div className="cem-success">
                <div className="cem-success-icon">
                  <CheckCircleIcon size={48} />
                </div>
                <h3>Enrollment Cancelled</h3>
                <p className="desc">
                  The cancellation has been submitted to the Stellar network. The <strong>Cancelled</strong> event
                  is permanently recorded on-chain with the following details.
                </p>

                <div className="cem-event-card">
                  <div className="cem-event-row">
                    <span className="cem-event-label">Event</span>
                    <span className="cem-event-value">
                      <span className="cem-event-badge">Cancelled</span>
                    </span>
                  </div>
                  <div className="cem-event-row">
                    <span className="cem-event-label">Proof Hash</span>
                    <span className="cem-event-value cem-event-hash">{successEvent.hash}</span>
                  </div>
                  <div className="cem-event-row">
                    <span className="cem-event-label">Tx Hash</span>
                    <span className="cem-event-value cem-event-hash" style={{ fontSize: '10px' }}>
                      {successEvent.txHash.slice(0, 24)}…{successEvent.txHash.slice(-16)}
                    </span>
                  </div>
                  <div className="cem-event-row">
                    <span className="cem-event-label">Ledger</span>
                    <span className="cem-event-value">#{successEvent.ledger.toLocaleString()}</span>
                  </div>
                  <div className="cem-event-row">
                    <span className="cem-event-label">Timestamp</span>
                    <span className="cem-event-value" style={{ fontSize: '10px' }}>{formatTimestamp(successEvent.timestamp)}</span>
                  </div>
                </div>

                <div className="cem-success-actions">
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${successEvent.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cem-btn-success"
                  >
                    <ExternalLinkIcon size={14} />
                    View on Stellar Expert
                  </a>
                  <button className="cem-btn-secondary" onClick={onClose}>
                    Close
                  </button>
                </div>
              </div>
            )}

            {/* ── Error Stage ── */}
            {stage === 'error' && (
              <div className="cem-error">
                <div className="cem-error-icon">
                  <AlertTriangleIcon size={20} />
                </div>
                <h3>Cancellation Failed</h3>
                <div className="cem-error-msg">
                  {errorMsg}
                </div>
                <button className="cem-btn-primary" onClick={handleRetry}>
                  Try Again
                </button>
                <button className="cem-btn-secondary" onClick={onClose}>
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

