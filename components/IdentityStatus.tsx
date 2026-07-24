import React from 'react'
import Skeleton from './Skeleton'

interface IdentityStatusProps {
  isLoading: boolean
  walletAddress?: string
  kycTier?: string
  status?: 'Verified' | 'Pending' | 'Unverified'
  onEnroll?: () => void
  onCancel?: () => void
}

export default function IdentityStatus({
  isLoading,
  walletAddress = 'GB3FUX...5H7Z2A',
  kycTier = 'Tier 1 (Basic Shielded Remittance)',
  status = 'Verified',
  onEnroll,
  onCancel,
}: IdentityStatusProps) {

  const css = `
    .id-card {
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
    .id-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }
    .id-card-title {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 16px;
      color: #0A0A0A;
      margin: 0;
    }
    .id-status-badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 10px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 100px;
      text-transform: uppercase;
    }
    .id-status-badge.verified {
      background: #DCE8DE;
      color: #17462B;
    }
    .id-status-badge.pending {
      background: #FFF2CC;
      color: #B2A100;
    }
    .id-status-badge.unverified {
      background: #FCE8E6;
      color: #A8201A;
    }
    .id-row-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #F6F6F3;
      border-radius: 12px;
      padding: 12px 14px;
      margin-bottom: 12px;
    }
    .id-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #ECE8FE;
      color: #5B3DF5;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .id-details {
      flex: 1;
    }
    .id-detail-label {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5px;
      color: #6B6960;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .id-detail-value {
      font-size: 12.5px;
      font-weight: 600;
      color: #0A0A0A;
    }
    .id-checks {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
    .id-check-pill {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 8.5px;
      background: #DCE8DE;
      color: #17462B;
      border: 1px solid rgba(23, 70, 43, 0.15);
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 3px;
    }
    .action-btn {
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 13px;
      color: #FFFFFF;
      background: linear-gradient(135deg, #5B3DF5, #6F5CE0);
      border: none;
      border-radius: 10px;
      padding: 10px 16px;
      cursor: pointer;
      width: 100%;
      text-align: center;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(91,61,245,0.25);
    }
    .action-btn.danger {
      background: linear-gradient(135deg, #A8201A, #C8302A);
    }
    .action-btn.danger:hover {
      box-shadow: 0 4px 12px rgba(168,32,26,0.25);
    }
  `

  if (isLoading) {
    return (
      <div
        className="id-card"
        aria-busy="true"
        aria-label="Loading identity compliance status"
        role="status"
        style={{ minHeight: '250px' }}
      >
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="id-card-header">
          <Skeleton variant="heading" width="130px" style={{ margin: 0 }} />
          <Skeleton variant="text" width="60px" style={{ height: '18px', borderRadius: '100px' }} />
        </div>

        <div className="id-row-item" style={{ marginBottom: '12px' }}>
          <Skeleton variant="circle" width="32px" height="32px" />
          <div className="id-details">
            <Skeleton variant="text" width="60px" style={{ height: '8px', marginBottom: '4px' }} />
            <Skeleton variant="text" width="100px" style={{ height: '12px' }} />
          </div>
        </div>

        <div className="id-row-item" style={{ marginBottom: 0 }}>
          <div className="id-details" style={{ width: '100%' }}>
            <Skeleton variant="text" width="80px" style={{ height: '8px', marginBottom: '6px' }} />
            <div className="id-checks">
              <Skeleton variant="text" width="65px" style={{ height: '14px', borderRadius: '4px' }} />
              <Skeleton variant="text" width="65px" style={{ height: '14px', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const avatarChar = walletAddress ? walletAddress.charAt(0) : 'G'

  return (
    <div className="id-card" style={{ minHeight: '250px' }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="id-card-header">
        <h3 className="id-card-title">Identity & Compliance</h3>
        <span className={`id-status-badge ${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      <div className="id-row-item">
        <div className="id-avatar">{avatarChar}</div>
        <div className="id-details">
          <span className="id-detail-label">Stellar Wallet</span>
          <div className="id-detail-value">{walletAddress}</div>
        </div>
      </div>

      {status === 'Unverified' ? (
        <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="id-checks" style={{ justifyContent: 'flex-start', marginBottom: '4px' }}>
            <span className="id-check-pill" style={{ background: '#FCE8E6', color: '#A8201A', borderColor: 'rgba(168,32,26,0.15)' }}>
              ✗ Unenrolled in Shielded Compliance
            </span>
          </div>
          {onEnroll && (
            <button className="action-btn" onClick={onEnroll} id="enroll-btn">
              Enroll in Shielded Compliance
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div className="id-row-item" style={{ marginBottom: 0 }}>
            <div className="id-details">
              <span className="id-detail-label">Verification Tier</span>
              <div className="id-detail-value" style={{ marginBottom: '6px' }}>{kycTier}</div>
              <div className="id-checks">
                <span className="id-check-pill">
                  ✓ AML Checked
                </span>
                <span className="id-check-pill">
                  ✓ Sanctions Clear
                </span>
                <span className="id-check-pill">
                  ✓ Geo Verified
                </span>
              </div>
            </div>
          </div>
          {onCancel && (
            <button className="action-btn danger" onClick={onCancel} id="cancel-btn">
              Cancel Enrollment
            </button>
          )}
        </div>
      )}
    </div>
  )
}
