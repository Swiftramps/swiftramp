'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { computePreimageDetails, type PreimageDetailsResult } from '../src/lib/preimage'

interface EnrollmentFormProps {
  /** Pre-fill the wallet address (the identity committed to by the proof). */
  defaultAddress?: string
  /** Called once the enrollment is successfully submitted. */
  onEnrolled?: (enrollment: { id: number; address: string; proof_hash: string }) => void
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
  .ef-root { width: 100%; max-width: 640px; margin: 0 auto; font-family: 'IBM Plex Sans', sans-serif; }
  .ef-field { margin-bottom: 18px; }
  .ef-label { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .ef-label-text { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.07em; color: #6B6960; }
  .ef-tip { border-bottom: 1px dashed #5B3DF5; color: #5B3DF5; cursor: help; }
  .ef-input {
    width: 100%; padding: 12px 14px; font-size: 14px; font-family: 'IBM Plex Mono', monospace;
    border: 1px solid #EAEAE6; border-radius: 10px; background: #FFFFFF; color: #0A0A0A;
  }
  .ef-input:focus { outline: 2px solid #5B3DF5; outline-offset: 0; border-color: transparent; }
  .ef-input.error { border-color: #B8433A; background: #FBE9E7; }
  .ef-help { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: #6B6960; margin-top: 5px; }

  .ef-preview {
    margin-top: 8px; border: 1px solid #EAEAE6; border-radius: 14px; overflow: hidden; background: #F6F6F3;
  }
  .ef-preview-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 10px 14px; border-bottom: 1px solid #EAEAE6; }
  .ef-preview-title { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #6B6960; }
  .ef-preview-state { font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; padding: 3px 9px; border-radius: 100px; }
  .ef-preview-state.ok { background: #DCE8DE; color: #17462B; }
  .ef-preview-state.warn { background: #FFF2CC; color: #B2A100; }
  .ef-preview-value {
    font-family: 'IBM Plex Mono', monospace; font-size: 12px; line-height: 1.6; word-break: break-all;
    padding: 14px; color: #5B3DF5; background: #ECE8FE; display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
  }
  .ef-copy-btn { background: none; border: none; color: #5B3DF5; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; flex-shrink: 0; }
  .ef-copy-btn:hover { text-decoration: underline; }
  .ef-status { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; margin-top: 8px; min-height: 16px; }
  .ef-status.error { color: #B8433A; }
  .ef-status.ok { color: #17462B; }

  .ef-submit {
    width: 100%; margin-top: 20px; padding: 14px; border: none; border-radius: 12px; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; color: #FFFFFF;
    background: linear-gradient(135deg, #5B3DF5, #6F5CE0); transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  }
  .ef-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(91,61,245,0.25); }
  .ef-submit:disabled { opacity: 0.45; cursor: not-allowed; }
  .ef-submit.spinning { opacity: 0.7; }
`

export default function EnrollmentForm({ defaultAddress = '', onEnrolled }: EnrollmentFormProps) {
  const [address, setAddress] = useState(defaultAddress)
  const [queueId, setQueueId] = useState('')
  const [timestampSec, setTimestampSec] = useState(() => Math.floor(Date.now() / 1000).toString())
  const [preview, setPreview] = useState<PreimageDetailsResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [copied, setCopied] = useState(false)

  // Recompute the expected proof hash reactively whenever a preimage field changes.
  useEffect(() => {
    let cancelled = false
    setPreview(null)
    setPreviewError(null)
    const lookupKey = `${address}|${queueId}|${timestampSec}`

    const numericTimestamp = Number(timestampSec)
    if (!/^G[A-Z2-7]{55}$/.test(address.trim()) || !queueId.trim() || !Number.isFinite(numericTimestamp)) {
      return () => { cancelled = true }
    }

    computePreimageDetails({ address: address.trim(), queueId: queueId.trim(), timestamp: numericTimestamp })
      .then(result => { if (!cancelled) setPreview(result) })
      .catch((err: unknown) => { if (!cancelled) setPreviewError(err instanceof Error ? err.message : 'Could not compute proof hash') })
    return () => { cancelled = true }
  }, [address, queueId, timestampSec])

  const canSubmit = useMemo(
    () => Boolean(preview && preview.computedHash.length === 64 && !submitting && !submitted),
    [preview, submitting, submitted],
  )

  const copyPreview = useCallback(async () => {
    if (!preview) return
    try {
      await navigator.clipboard.writeText(preview.computedHash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard may be blocked; value is still selectable */
    }
  }, [preview])

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || !preview) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000'
      const identity = address.trim()
      const res = await fetch(`${backendUrl}/enrollments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: identity,
          identity,
          queueId: queueId.trim(),
          timestampSec: Number(timestampSec),
        }),
      })
      if (!res.ok) throw new Error(`Enrollment failed (${res.status})`)
      const data = await res.json()
      setSubmitted(true)
      onEnrolled?.(data)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Enrollment failed')
    } finally {
      setSubmitting(false)
    }
  }, [canSubmit, preview, address, queueId, timestampSec, onEnrolled])

  const addressValid = /^G[A-Z2-7]{55}$/.test(address.trim())
  const queueValid = Boolean(queueId.trim())
  const timestampValid = Number.isFinite(Number(timestampSec))
  const ready = addressValid && queueValid && timestampValid

  return (
    <div className="ef-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="ef-field">
        <div className="ef-label">
          <span className="ef-label-text">Wallet address (identity)</span>
          <span className="ef-tip" title="The identity committed to by the proof. SHA-256 hashes the raw 32-byte Ed25519 key recovered from this G... address.">What is this?</span>
        </div>
        <input
          className={`ef-input${!addressValid && address ? ' error' : ''}`}
          value={address}
          onChange={e => { setAddress(e.target.value); setSubmitted(false) }}
          placeholder="G..."
          aria-label="Wallet address"
          inputMode="text"
          autoComplete="off"
        />
        <div className="ef-help">Must be a 56-character Stellar public key beginning with G.</div>
      </div>

      <div className="ef-field">
        <div className="ef-label">
          <span className="ef-label-text">Queue ID</span>
          <span className="ef-tip" title="The queue the identity enrolls in. Hashed as UTF-8 bytes in the preimage, between the identity and the timestamp.">What is this?</span>
        </div>
        <input
          className={`ef-input${!queueValid && queueId ? ' error' : ''}`}
          value={queueId}
          onChange={e => { setQueueId(e.target.value); setSubmitted(false) }}
          placeholder="remit-queue-01"
          aria-label="Queue ID"
          autoComplete="off"
        />
        <div className="ef-help">A non-empty identifier for the queue being joined.</div>
      </div>

      <div className="ef-field">
        <div className="ef-label">
          <span className="ef-label-text">Enrollment timestamp (unix seconds)</span>
          <span className="ef-tip" title="When the enrollment is committed. Encoded big-endian in a fixed 8 bytes at the end of the preimage.">What is this?</span>
        </div>
        <input
          className={`ef-input${!timestampValid ? ' error' : ''}`}
          type="number"
          value={timestampSec}
          onChange={e => { setTimestampSec(e.target.value); setSubmitted(false) }}
          aria-label="Enrollment timestamp"
        />
        <div className="ef-help">Updates live as you type; defaults to now.</div>
      </div>

      <div className="ef-preview">
        <div className="ef-preview-head">
          <span className="ef-preview-title">Computed proof hash</span>
          <span className={`ef-preview-state ${ready ? 'ok' : 'warn'}`}>
            {ready ? (preview ? 'live' : 'computing…') : 'incomplete'}
          </span>
        </div>
        <div className="ef-preview-value" aria-live="polite">
          <span data-testid="proof-preview">
            {preview ? preview.computedHash : previewError || 'Fill in all preimage fields to see the hash.'}
          </span>
          {preview ? (
            <button type="button" className="ef-copy-btn" onClick={copyPreview} aria-label="Copy proof hash">
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          ) : null}
        </div>
      </div>

      <div className={`ef-status ${submitError ? 'error' : submitted ? 'ok' : ''}`} aria-live="polite">
        {submitError ? submitError : submitted ? 'Enrollment recorded.' : previewError ? previewError : ''}
      </div>

      <button
        type="button"
        className={`ef-submit${submitting ? ' spinning' : ''}`}
        onClick={handleSubmit}
        disabled={!canSubmit}
      >
        {submitting ? 'Submitting…' : submitted ? 'Enrolled ✓' : 'Enroll with proof'}
      </button>
    </div>
  )
}