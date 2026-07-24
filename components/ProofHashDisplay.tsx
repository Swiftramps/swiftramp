import React from 'react'
import Skeleton from './Skeleton'

interface ProofHashDisplayProps {
  isLoading: boolean
  proofHex?: string
  proofType?: string
  curve?: string
  computationTimeMs?: number
}

export default function ProofHashDisplay({
  isLoading,
  proofHex = '0x3a4b92c81d7f6e0b5a3c8d9e2f4a1c5b8d9e0f3a6b2c7d9a1e0f3b4c5d6e7f8',
  proofType = 'zk-SNARK / Groth16',
  curve = 'BN254',
  computationTimeMs = 84,
}: ProofHashDisplayProps) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(proofHex)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Consistent styles and CSS variables matching swiftramp
  const css = `
    .proof-card {
      background: #FFFFFF;
      border: 1.5px solid #EAEAE6;
      border-radius: 22px;
      padding: 24px;
      min-height: 250px;
      box-shadow: 0 12px 40px rgba(10,10,10,0.05);
      font-family: 'IBM Plex Sans', sans-serif;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .proof-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .proof-card-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: #0A0A0A;
      margin: 0;
    }
    .proof-badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      font-weight: 600;
      background: #ECE8FE;
      color: #5B3DF5;
      padding: 4px 10px;
      border-radius: 100px;
      text-transform: uppercase;
    }
    .proof-hex-box {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 11px;
      color: #5B3DF5;
      background: #ECE8FE;
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 16px;
      word-break: break-all;
      line-height: 1.5;
      position: relative;
      cursor: pointer;
      border: 1px solid transparent;
      transition: all 0.2s ease;
    }
    .proof-hex-box:hover {
      border-color: #5B3DF5;
    }
    .copy-indicator {
      position: absolute;
      right: 10px;
      bottom: 8px;
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      opacity: 0.7;
    }
    .proof-grid {
      display: grid;
      grid-template-cols: 1fr 1fr;
      gap: 12px;
    }
    .proof-param {
      background: #F6F6F3;
      border-radius: 10px;
      padding: 10px;
      font-size: 11px;
    }
    .proof-param-label {
      color: #6B6960;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
      display: block;
    }
    .proof-param-val {
      font-weight: 600;
      color: #0A0A0A;
    }
  `

  if (isLoading) {
    return (
      <div
        className="proof-card"
        aria-busy="true"
        aria-label="Loading proof hash details"
        role="status"
        style={{ minHeight: '250px' }}
      >
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="proof-card-header">
          <Skeleton variant="heading" width="160px" style={{ margin: 0 }} />
          <Skeleton variant="text" width="65px" style={{ height: '18px', borderRadius: '100px' }} />
        </div>
        
        <Skeleton variant="text" width="100%" style={{ height: '58px', borderRadius: '10px', marginBottom: '16px' }} />

        <div className="proof-grid">
          <div className="proof-param">
            <Skeleton variant="text" width="40px" style={{ height: '10px', marginBottom: '4px' }} />
            <Skeleton variant="text" width="80px" style={{ height: '12px' }} />
          </div>
          <div className="proof-param">
            <Skeleton variant="text" width="50px" style={{ height: '10px', marginBottom: '4px' }} />
            <Skeleton variant="text" width="70px" style={{ height: '12px' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="proof-card" style={{ minHeight: '250px' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="proof-card-header">
        <h3 className="proof-card-title">Cryptographic Proof</h3>
        <span className="proof-badge">zk-SNARK</span>
      </div>

      <div className="proof-hex-box" onClick={handleCopy} title="Click to copy proof commitment">
        {proofHex}
        <span className="copy-indicator" style={{ color: copied ? '#17462B' : '#5B3DF5' }}>
          {copied ? '✓ Copied' : 'Click to copy'}
        </span>
      </div>

      <div className="proof-grid">
        <div className="proof-param">
          <span className="proof-param-label">Verifier Engine</span>
          <span className="proof-param-val">{proofType}</span>
        </div>
        <div className="proof-param">
          <span className="proof-param-label">Elliptic Curve</span>
          <span className="proof-param-val">{curve} (Verified on-chain)</span>
        </div>
        <div className="proof-param" style={{ gridColumn: 'span 2' }}>
          <span className="proof-param-label">Computation Time</span>
          <span className="proof-param-val">{computationTimeMs}ms (Pedersen + SNARK)</span>
        </div>
      </div>
    </div>
  )
}
