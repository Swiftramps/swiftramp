'use client'
import Navbar from '../../../../components/Navbar'

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
    --danger: #B8433A;
    --danger-soft: #FBE9E7;
    --fill: #F6F6F3;
    --shadow-sm: 0 2px 10px rgba(10,10,10,0.05);
  }
  * { box-sizing: border-box; }
  .docs-page { min-height: 100vh; background: var(--paper); color: var(--ink); font-family: 'IBM Plex Sans', sans-serif; }
  .docs-container { max-width: 780px; margin: 0 auto; padding: 64px 24px 96px; }
  .docs-eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--privacy); margin-bottom: 12px; }
  .docs-title { font-family: 'Space Grotesk', sans-serif; font-size: 40px; font-weight: 700; margin: 0 0 16px; letter-spacing: -0.01em; }
  .docs-lede { font-size: 17px; line-height: 1.7; color: var(--muted); margin: 0 0 48px; }
  .docs-section { margin-bottom: 48px; }
  .docs-h2 { font-family: 'Space Grotesk', sans-serif; font-size: 24px; font-weight: 700; margin: 0 0 16px; }
  .docs-p { font-size: 15.5px; line-height: 1.75; color: var(--ink); margin: 0 0 16px; }
  .docs-code-block { background: var(--fill); border: 1px solid var(--line); border-radius: 12px; padding: 16px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; line-height: 1.7; overflow-x: auto; margin: 0 0 16px; color: var(--ink); }
  .docs-inline-code { font-family: 'IBM Plex Mono', monospace; font-size: 0.85em; background: var(--privacy-soft); color: var(--privacy); padding: 1px 6px; border-radius: 5px; }
  .docs-card { background: var(--privacy-soft); border: 1px solid var(--privacy); border-radius: 14px; padding: 20px 24px; margin-bottom: 16px; }
  .docs-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 17px; margin: 0 0 8px; color: var(--privacy); }
  .docs-card p { margin: 0; font-size: 14.5px; line-height: 1.65; }
  .docs-list { padding-left: 22px; margin: 0 0 16px; }
  .docs-list li { margin-bottom: 10px; line-height: 1.7; font-size: 15px; }
  .docs-steps { counter-reset: step; list-style: none; padding: 0; margin: 0 0 16px; }
  .docs-steps li { counter-increment: step; position: relative; padding: 0 0 20px 44px; font-size: 15px; line-height: 1.7; }
  .docs-steps li::before { content: counter(step); position: absolute; left: 0; top: 0; width: 30px; height: 30px; background: var(--accent); color: var(--paper); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 14px; }
  .docs-links { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-top: 8px; }
  .docs-link-card { display: block; text-decoration: none; background: var(--paper); border: 1px solid var(--line); border-radius: 14px; padding: 18px 20px; color: var(--ink); box-shadow: var(--shadow-sm); transition: all 0.2s ease; }
  .docs-link-card:hover { border-color: var(--privacy); transform: translateY(-1px); }
  .docs-link-card .docs-link-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 15px; margin-bottom: 4px; display: block; }
  .docs-link-card .docs-link-desc { font-size: 13px; color: var(--muted); line-height: 1.5; display: block; }
  .docs-note { background: var(--accent-soft); border-radius: 10px; padding: 14px 18px; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
  .docs-note strong { color: var(--accent); }
  @keyframes docsFadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  .docs-fade { animation: docsFadeUp 0.6s cubic-bezier(0.2, 0.6, 0.2, 1) both; }
  @media (max-width: 600px) {
    .docs-container { padding: 40px 18px 80px; }
    .docs-title { font-size: 30px; }
    .docs-lede { font-size: 16px; }
    .docs-code-block { font-size: 12px; padding: 14px 14px; }
  }
`

export default function AuditModelDocs() {
  return (
    <div className="docs-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />

      <div className="docs-container">
        <div className="docs-fade" style={{ animationDelay: '0.05s' }}>
          <div className="docs-eyebrow">Documentation · Audit Model</div>
          <h1 className="docs-title">The Audit Proof Model</h1>
          <p className="docs-lede">
            Every enrollment, cancellation, and transfer on Swiftramps is committed to
            an immutable, independently verifiable proof hash. This page explains what a
            proof hash is, how auditors can verify one, what the cancel audit trail
            records, and how the <span className="docs-inline-code">can_transfer</span> guard works.
          </p>
        </div>

        <section className="docs-section docs-fade" style={{ animationDelay: '0.1s' }}>
          <h2 className="docs-h2">What a proof hash is</h2>
          <p className="docs-p">
            A proof hash is a SHA-256 digest of a fixed, deterministic byte sequence
            called the <em>preimage</em>. It commits to three facts about an enrollment:
          </p>
          <ul className="docs-list">
            <li><strong>WHO</strong> enrolled — the raw 32-byte Ed25519 public key recovered from the Stellar <span className="docs-inline-code">G...</span> address</li>
            <li><strong>WHICH</strong> queue they enrolled in — the queue id as UTF-8 bytes</li>
            <li><strong>WHEN</strong> — the unix timestamp, encoded big-endian in a fixed 8 bytes</li>
          </ul>
          <div className="docs-code-block">
            preimage&nbsp;&nbsp;= identity_bytes (32) || queue_id_bytes (UTF-8) || timestamp (8, big-endian)<br />
            proof_hash = SHA-256(preimage)
          </div>
          <p className="docs-p">
            The timestamp is fixed-width precisely so the preimage stays unambiguous:
            without it, a queue id ending in digits could be confused with the start of
            the timestamp. The exact byte layout is defined once in the shared
            <span className="docs-inline-code"> preimage </span> utility and mirrored
            byte-for-byte in the on-chain contract, so auditors can reproduce the digest
            independently.
          </p>
          <div className="docs-card">
            <h3>Proof of registration, not the data itself</h3>
            <p>
              Hashing is one-way: the proof hash proves an identity enrolled in a queue
              at a given time without revealing anything else about them. Anyone can
              re-compute the hash from the public preimage components, but nobody can
              reverse the hash back into the data.
            </p>
          </div>
        </section>

        <section className="docs-section docs-fade" style={{ animationDelay: '0.15s' }}>
          <h2 className="docs-h2">How to verify a proof hash</h2>
          <p className="docs-p">
            Verification reproduces the digest from the preimage components and compares
            it to the recorded hash. A match means the record is genuine; a mismatch
            means the record was tampered with or the components were transcribed
            incorrectly.
          </p>
          <ol className="docs-steps">
            <li>Look up the recorded <span className="docs-inline-code">proof_hash</span> and its preimage components (identity, queueId, timestamp) for the event.</li>
            <li>Decode the Stellar address into its raw 32-byte Ed25519 key (strip the version and CRC bytes).</li>
            <li>Assemble the preimage: identity bytes, queue id UTF-8 bytes, timestamp big-endian.</li>
            <li>Compute <span className="docs-inline-code">SHA-256(preimage)</span> and compare (case-insensitive, ignoring an optional <span className="docs-inline-code">0x</span> prefix).</li>
          </ol>
          <p className="docs-p">The same digest can be reproduced offline with a one-liner:</p>
          <div className="docs-code-block">
            printf &apos;%s&apos; '&lt;preimage-hex&gt;' | xxd -r -p | shasum -a 256
          </div>
          <div className="docs-note">
            <strong>Live check:</strong> the UI verifies recorded hashes automatically in
            the audit trail and on the identity status badge — a verified badge means the
            recorded hash matches the locally re-computed digest.
          </div>
        </section>

        <section className="docs-section docs-fade" style={{ animationDelay: '0.2s' }}>
          <h2 className="docs-h2">The cancel audit trail</h2>
          <p className="docs-p">
            Cancelling an enrollment never erases history. The original enrollment stays
            in the ledger with its proof hash; the cancellation is appended as a separate
            <span className="docs-inline-code"> cancelled </span> event and recorded
            locally with an audit trail containing:
          </p>
          <ul className="docs-list">
            <li><strong>proof_hash</strong> — the original enrollment hash, so the cancelled record can be tied back to its enrollment</li>
            <li><strong>canceled_at</strong> — when the cancellation was recorded</li>
            <li><strong>canceled_by</strong> — which Stellar address issued the cancellation (when supplied)</li>
          </ul>
          <p className="docs-p">
            The chain of custody is therefore: enroll (hash A) → cancel (records hash A +
            cancelled event), and the trail is chronological and append-only. A cancelled
            enrollment cannot be cancelled twice.
          </p>
        </section>

        <section className="docs-section docs-fade" style={{ animationDelay: '0.25s' }}>
          <h2 className="docs-h2">can_transfer semantics</h2>
          <p className="docs-p">
            The identity contract uses <span className="docs-inline-code">can_transfer</span> as
            the gate before any transfer is allowed. It returns true only when every
            precondition holds:
          </p>
          <ul className="docs-list">
            <li>The identity is <strong>enrolled</strong> in the target queue (queue membership is required — an unenrolled identity cannot transfer)</li>
            <li>The identity is <strong>not revoked</strong> — a revoked identity is blocked regardless of enrollment</li>
            <li>The enrollment is <strong>active</strong> (not cancelled)</li>
          </ul>
          <p className="docs-p">
            Because every one of these facts is anchored to a proof hash, the gate is
            auditable end-to-end: you can see exactly which proof authorized the transfer
            and independently verify that proof against the ledger.
          </p>
        </section>

        <section className="docs-section docs-fade" style={{ animationDelay: '0.3s' }}>
          <h2 className="docs-h2">Related documentation</h2>
          <div className="docs-links">
            <a className="docs-link-card" href="https://github.com/Swiftramps/swiftramp" target="_blank" rel="noopener noreferrer">
              <span className="docs-link-title">Frontend source</span>
              <span className="docs-link-desc">The Next.js app, including the audit trail UI and preimage utilities.</span>
            </a>
            <a className="docs-link-card" href="https://github.com/Swiftramps/swift-ramp-backend" target="_blank" rel="noopener noreferrer">
              <span className="docs-link-title">Backend API</span>
              <span className="docs-link-desc">Enrollment, verification, and cancel endpoints and the audit cache.</span>
            </a>
            <a className="docs-link-card" href="https://github.com/Swiftramps/swift-ramp-smartcontract" target="_blank" rel="noopener noreferrer">
              <span className="docs-link-title">Smart contract</span>
              <span className="docs-link-desc">The Soroban contract implementing enrollment, can_transfer, and revocation.</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  )
}
