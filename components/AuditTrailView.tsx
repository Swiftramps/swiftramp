import React from 'react'
import Skeleton from './Skeleton'

interface AuditStep {
  label: string
  sub: string
  status: 'pending' | 'success' | 'failed'
  time?: string
}

interface AuditTrailViewProps {
  isLoading: boolean
  steps?: AuditStep[]
}

const DEFAULT_STEPS: AuditStep[] = [
  { label: 'Compute Pedersen Commitment', sub: 'Homomorphic commitment created locally', status: 'success', time: '14ms' },
  { label: 'Solve Balance Constraints', sub: 'Inputs proved inside zero-knowledge boundary', status: 'success', time: '28ms' },
  { label: 'Generate zk-SNARK Proof', sub: 'Balances proven valid, values shielded', status: 'success', time: '42ms' },
  { label: 'Verify Soroban Host VM', status: 'success', sub: 'Ledger verifier executed verification keys', time: '24ms' },
  { label: 'Ledger Settlement Consensus', sub: 'Stellar ledger validated state updates', status: 'success', time: '18ms' }
]

export default function AuditTrailView({
  isLoading,
  steps = DEFAULT_STEPS,
}: AuditTrailViewProps) {

  const css = `
    .audit-card {
      background: #FFFFFF;
      border: 1.5px solid #EAEAE6;
      border-radius: 22px;
      padding: 24px;
      min-height: 380px;
      box-shadow: 0 12px 40px rgba(10,10,10,0.05);
      font-family: 'IBM Plex Sans', sans-serif;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
    }
    .audit-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      border-bottom: 1px solid #EAEAE6;
      padding-bottom: 12px;
    }
    .audit-card-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: #0A0A0A;
      margin: 0;
    }
    .audit-card-badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      color: #17462B;
      background: #DCE8DE;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .audit-steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }
    .audit-step {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      font-size: 13px;
    }
    .audit-step-bullet {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 1px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1.5px solid #EAEAE6;
      font-size: 10px;
      font-weight: 700;
      transition: all 0.25s ease;
    }
    .audit-step.success .audit-step-bullet {
      background: #DCE8DE;
      border-color: #17462B;
      color: #17462B;
    }
    .audit-step.failed .audit-step-bullet {
      background: #FCE8E6;
      border-color: #A8201A;
      color: #A8201A;
    }
    .audit-step.pending .audit-step-bullet {
      border-color: #5B3DF5;
      animation: pulse-border 1.5s infinite;
    }
    @keyframes pulse-border {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.6; }
    }
    .audit-step-content {
      flex: 1;
    }
    .audit-step-label {
      font-weight: 600;
      color: #0A0A0A;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .audit-step-time {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 9px;
      color: #6B6960;
    }
    .audit-step-sub {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10.5px;
      color: #6B6960;
      margin-top: 2px;
    }
  `

  if (isLoading) {
    return (
      <div
        className="audit-card"
        aria-busy="true"
        aria-label="Loading verification log trail"
        role="status"
        style={{ minHeight: '380px' }}
      >
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="audit-card-header">
          <Skeleton variant="heading" width="150px" style={{ margin: 0 }} />
          <Skeleton variant="text" width="60px" style={{ height: '16px', borderRadius: '6px' }} />
        </div>

        <div className="audit-steps">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="audit-step" key={i}>
              <Skeleton variant="circle" width="18px" height="18px" style={{ marginTop: '2px' }} />
              <div className="audit-step-content" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'between', width: '100%', marginBottom: '4px' }}>
                  <Skeleton variant="text" width="130px" style={{ height: '12px' }} />
                  <Skeleton variant="text" width="30px" style={{ height: '10px', marginLeft: 'auto' }} />
                </div>
                <Skeleton variant="text" width="220px" style={{ height: '10px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="audit-card" style={{ minHeight: '380px' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="audit-card-header">
        <h3 className="audit-card-title">Verification Trail</h3>
        <span className="audit-card-badge">Verified Logs</span>
      </div>

      <div className="audit-steps">
        {steps.map((step, idx) => (
          <div className={`audit-step ${step.status}`} key={idx}>
            <div className="audit-step-bullet">
              {step.status === 'success' ? '✓' : step.status === 'failed' ? '✗' : '●'}
            </div>
            <div className="audit-step-content">
              <div className="audit-step-label">
                <span>{step.label}</span>
                {step.time && <span className="audit-step-time">{step.time}</span>}
              </div>
              <div className="audit-step-sub">{step.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
