'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  computePreimageDetails,
  offlineVerificationCommands,
  type PreimageDetailsResult,
} from '../src/lib/preimage'

interface PreimageDetailsProps {
  /** Stellar "G..." address of the enrolling identity. */
  address: string
  /** Queue identifier committed to by the proof. */
  queueId: string
  /** ISO-8601 timestamp (or unix seconds) of the event. */
  timestamp: string | number
  /** The proof hash recorded on-chain, for comparison. */
  recordedHash?: string
  /** Open on mount. Defaults to false: this is an advanced, opt-in view. */
  defaultOpen?: boolean
}

const CSS = `
  .pmd-root {
    width: 100%;
    border: 1px solid var(--line, #EAEAE6);
    border-radius: 12px;
    background: var(--paper, #FFFFFF);
    overflow: hidden;
  }

  .pmd-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--fill, #F6F6F3);
    border: none;
    padding: 10px 14px;
    cursor: pointer;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--muted, #6B6960);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: left;
  }

  .pmd-toggle:hover { color: var(--ink, #0A0A0A); }
  .pmd-toggle:focus-visible {
    outline: 2px solid var(--privacy, #5B3DF5);
    outline-offset: -2px;
  }

  .pmd-chevron { transition: transform 0.2s ease; flex-shrink: 0; }
  .pmd-chevron.open { transform: rotate(90deg); }
  .pmd-toggle-spacer { flex: 1; }

  .pmd-verdict {
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 100px;
    letter-spacing: 0.04em;
  }
  .pmd-verdict.match {
    background: var(--accent-soft, #DCE8DE);
    color: var(--accent, #17462B);
  }
  .pmd-verdict.mismatch {
    background: var(--danger-soft, #FBE9E7);
    color: var(--danger, #B8433A);
  }

  .pmd-body { padding: 16px 14px; display: flex; flex-direction: column; gap: 18px; }

  .pmd-step-label {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    font-weight: 600;
    color: var(--muted, #6B6960);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin: 0 0 8px;
  }

  .pmd-field { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
  .pmd-field:last-child { margin-bottom: 0; }

  .pmd-field-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;
  }

  .pmd-field-name {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    color: var(--ink, #0A0A0A);
  }

  .pmd-field-note { font-size: 11px; color: var(--muted, #6B6960); }

  .pmd-value-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    background: var(--fill, #F6F6F3);
    border: 1px solid var(--line, #EAEAE6);
    border-radius: 8px;
    padding: 8px 10px;
  }

  .pmd-value {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    line-height: 1.55;
    color: var(--ink, #0A0A0A);
    word-break: break-all;
    overflow-wrap: anywhere;
    user-select: all;
    flex: 1;
    min-width: 0;
  }

  .pmd-value.digest { font-weight: 600; }

  .pmd-copy {
    background: transparent;
    border: none;
    color: var(--muted, #6B6960);
    cursor: pointer;
    width: 28px;
    height: 28px;
    flex-shrink: 0;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .pmd-copy:hover { color: var(--ink, #0A0A0A); background: var(--line, #EAEAE6); }
  .pmd-copy:focus-visible {
    outline: 2px solid var(--privacy, #5B3DF5);
    outline-offset: 1px;
  }

  .pmd-concat {
    display: flex;
    flex-wrap: wrap;
    font-family: 'IBM Plex Mono', monospace;
    font-size: 12px;
    line-height: 1.55;
    word-break: break-all;
    overflow-wrap: anywhere;
  }
  .pmd-seg { padding: 1px 0; border-radius: 3px; }
  .pmd-seg.identity { background: #E7E2FE; color: #3B2BB5; }
  .pmd-seg.queue { background: var(--accent-soft, #DCE8DE); color: var(--accent, #17462B); }
  .pmd-seg.time { background: #FDF0D5; color: #7A5A12; }

  .pmd-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 6px;
    font-size: 10.5px;
    color: var(--muted, #6B6960);
    font-family: 'IBM Plex Mono', monospace;
  }
  .pmd-legend span { display: inline-flex; align-items: center; gap: 4px; }
  .pmd-dot { width: 9px; height: 9px; border-radius: 2px; display: inline-block; }

  .pmd-verify-box {
    border-top: 1px dashed var(--line, #EAEAE6);
    padding-top: 14px;
  }

  .pmd-instructions {
    font-size: 12.5px;
    line-height: 1.6;
    color: var(--muted, #6B6960);
    margin: 0 0 10px;
  }

  .pmd-cmd { margin-bottom: 8px; }
  .pmd-cmd:last-child { margin-bottom: 0; }
  .pmd-cmd-name {
    font-family: 'IBM Plex Mono', monospace;
    font-size: 10.5px;
    color: var(--muted, #6B6960);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    display: block;
    margin-bottom: 3px;
  }

  .pmd-status { font-size: 12.5px; color: var(--muted, #6B6960); padding: 4px 0; }
  .pmd-error {
    color: var(--danger, #B8433A);
    background: var(--danger-soft, #FBE9E7);
    border: 1px solid var(--danger, #B8433A);
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 12.5px;
  }

  @media (max-width: 600px) {
    .pmd-field-head { flex-direction: column; gap: 2px; }
  }
`

function ChevronIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function CopyIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

/** A labelled, monospaced, individually copyable value. */
function CopyableField({
  name,
  note,
  value,
  digest = false,
}: {
  name: string
  note?: string
  value: string
  digest?: boolean
}) {
  const [copied, setCopied] = useState(false)

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard can be blocked (insecure origin, permissions). The value is
      // still selectable, so failing quietly is better than throwing at them.
    }
  }, [value])

  return (
    <div className="pmd-field">
      <div className="pmd-field-head">
        <span className="pmd-field-name">{name}</span>
        {note ? <span className="pmd-field-note">{note}</span> : null}
      </div>
      <div className="pmd-value-row">
        <code className={`pmd-value${digest ? ' digest' : ''}`}>{value}</code>
        <button
          type="button"
          className="pmd-copy"
          onClick={copy}
          aria-label={copied ? `${name} copied` : `Copy ${name}`}
          title={copied ? 'Copied' : 'Copy'}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
        </button>
      </div>
    </div>
  )
}

/**
 * Auditor-facing breakdown of a proof hash (issue #39).
 *
 * Shows each preimage component in hex, the concatenated bytes that are fed to
 * SHA-256, the resulting digest, and whether it reproduces the recorded proof
 * hash — plus commands to repeat the computation offline. Collapsed by default,
 * because this is detail most users never need.
 */
export default function PreimageDetails({
  address,
  queueId,
  timestamp,
  recordedHash,
  defaultOpen = false,
}: PreimageDetailsProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [details, setDetails] = useState<PreimageDetailsResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Derive only once opened: hashing every row on a long audit page is wasteful.
  useEffect(() => {
    if (!open || details || error) return
    let cancelled = false
    computePreimageDetails({ address, queueId, timestamp }, recordedHash)
      .then(result => {
        if (!cancelled) setDetails(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not derive preimage')
      })
    return () => {
      cancelled = true
    }
  }, [open, details, error, address, queueId, timestamp, recordedHash])

  const commands = useMemo(
    () => (details ? offlineVerificationCommands(details.preimageHex) : null),
    [details],
  )

  return (
    <div className="pmd-root">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <button
        type="button"
        className="pmd-toggle"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls="pmd-body"
      >
        <span className={`pmd-chevron${open ? ' open' : ''}`}>
          <ChevronIcon />
        </span>
        <span>Preimage details</span>
        <span className="pmd-toggle-spacer" />
        {details ? (
          <span className={`pmd-verdict ${details.matches ? 'match' : 'mismatch'}`}>
            {details.matches ? 'Reproduces hash' : 'Does not match'}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="pmd-body" id="pmd-body">
          {error ? (
            <div className="pmd-error" role="alert">
              {error}
            </div>
          ) : !details ? (
            <div className="pmd-status" aria-busy="true">
              Deriving preimage…
            </div>
          ) : (
            <>
              <section>
                <h4 className="pmd-step-label">Step 1 — Preimage components (hex)</h4>
                <CopyableField
                  name="identity_bytes"
                  note="32 bytes · Ed25519 key decoded from the G… address"
                  value={details.identityHex}
                />
                <CopyableField
                  name="queue_id_bytes"
                  note={`${details.queueIdBytes.length} bytes · UTF-8 of "${queueId}"`}
                  value={details.queueIdHex}
                />
                <CopyableField
                  name="timestamp"
                  note={`8 bytes · big-endian unix seconds (${details.unixSeconds})`}
                  value={details.timestampHex}
                />
              </section>

              <section>
                <h4 className="pmd-step-label">
                  Step 2 — Concatenated preimage ({details.preimage.length} bytes hashed)
                </h4>
                <div className="pmd-value-row">
                  <span className="pmd-concat">
                    <span className="pmd-seg identity">{details.identityHex}</span>
                    <span className="pmd-seg queue">{details.queueIdHex}</span>
                    <span className="pmd-seg time">{details.timestampHex}</span>
                  </span>
                </div>
                <div className="pmd-legend">
                  <span><i className="pmd-dot" style={{ background: '#E7E2FE' }} /> identity</span>
                  <span><i className="pmd-dot" style={{ background: '#DCE8DE' }} /> queue_id</span>
                  <span><i className="pmd-dot" style={{ background: '#FDF0D5' }} /> timestamp</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <CopyableField
                    name="preimage"
                    note="exact bytes passed to SHA-256"
                    value={details.preimageHex}
                  />
                </div>
              </section>

              <section>
                <h4 className="pmd-step-label">Step 3 — SHA-256 digest</h4>
                <CopyableField name="computed_hash" value={details.computedHash} digest />
                {recordedHash ? (
                  <CopyableField
                    name="recorded_proof_hash"
                    note={details.matches ? 'identical to computed' : 'differs from computed'}
                    value={recordedHash}
                  />
                ) : null}
              </section>

              <section className="pmd-verify-box">
                <h4 className="pmd-step-label">Verify offline</h4>
                <p className="pmd-instructions">
                  Copy the <code>preimage</code> hex from Step 2 and hash it yourself. The
                  commands below decode that hex back to raw bytes and print their SHA-256; the
                  output must equal <code>computed_hash</code> above. Nothing here depends on this
                  page — you can reproduce the digest on any machine, offline.
                </p>
                {commands ? (
                  <>
                    <div className="pmd-cmd">
                      <span className="pmd-cmd-name">shasum</span>
                      <CopyableField name="shasum command" value={commands.shasum} />
                    </div>
                    <div className="pmd-cmd">
                      <span className="pmd-cmd-name">openssl</span>
                      <CopyableField name="openssl command" value={commands.openssl} />
                    </div>
                    <div className="pmd-cmd">
                      <span className="pmd-cmd-name">python</span>
                      <CopyableField name="python command" value={commands.python} />
                    </div>
                  </>
                ) : null}
              </section>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
