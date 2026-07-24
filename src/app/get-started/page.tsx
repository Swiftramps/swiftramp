'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../../../components/Navbar'

// npm install @stellar/freighter-api
import {
  isConnected as freighterIsConnected,
  isAllowed as freighterIsAllowed,
  setAllowed as freighterSetAllowed,
  getAddress as freighterGetAddress,
} from '@stellar/freighter-api'

type Stage = 'idle' | 'checking' | 'no-wallet' | 'requesting' | 'connected' | 'error' | 'identity-not-registered' | 'identity-revoked' | 'network-error'

// Change this if your swap/converter screen lives at a different route.
const SWAP_ROUTE = '/swap'
const WALLET_STORAGE_KEY = 'swiftramp_stellar_address'

function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

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
    --fill: #F6F6F3;
    --danger: #B8433A;
    --danger-soft: #FBE9E7;
    --shadow-sm: 0 2px 10px rgba(10,10,10,0.05);
    --shadow-md: 0 12px 40px rgba(10,10,10,0.07);
    --shadow-lg: 0 24px 70px rgba(10,10,10,0.10);
  }
  * { box-sizing: border-box; }
  .gs-page {
    min-height: calc(100vh - 82px);
    background: var(--paper);
    color: var(--ink);
    font-family: 'IBM Plex Sans', sans-serif;
    position: relative;
    overflow-x: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .gs-blob {
    position: absolute; border-radius: 50%; filter: blur(70px); z-index: 0; pointer-events: none;
  }
  .gs-blob-1 { width: 380px; height: 380px; background: var(--accent-soft); opacity: 0.5; top: -100px; left: -120px; }
  .gs-blob-2 { width: 320px; height: 320px; background: var(--privacy-soft); opacity: 0.55; top: 60px; right: -100px; }

  .fade-up { opacity: 0; transform: translateY(16px); animation: fadeUp 0.7s cubic-bezier(0.2,0.6,0.2,1) forwards; }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .display { font-family: 'Space Grotesk', sans-serif; }

  .gs-hero { max-width: 560px; margin: 0 auto; padding: 72px 24px 8px; text-align: center; position: relative; z-index: 1; }
  .gs-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--privacy); background: var(--privacy-soft);
    padding: 6px 14px; border-radius: 100px; margin-bottom: 24px; box-shadow: var(--shadow-sm);
  }
  .gs-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--privacy); animation: pulse 1.6s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .gs-hero h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 40px; line-height: 1.08; letter-spacing: -0.01em; margin: 0 0 14px; }
  .gs-hero p { color: var(--muted); font-size: 16px; line-height: 1.6; margin: 0 auto; max-width: 420px; }

  .gs-card-wrap { max-width: 440px; width: 100%; margin: 40px auto 0; padding: 0 24px 100px; position: relative; z-index: 1; }
  .gs-card {
    background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 36px 32px;
    box-shadow: var(--shadow-lg); text-align: center; position: relative;
    animation: fadeUp 0.5s cubic-bezier(0.2,0.6,0.2,1);
  }

  .gs-wallet-icon {
    width: 64px; height: 64px; border-radius: 18px; margin: 0 auto 22px;
    background: var(--accent-soft); display: flex; align-items: center; justify-content: center;
  }
  .gs-wallet-icon.privacy { background: var(--privacy-soft); }
  .gs-wallet-icon.error { background: var(--danger-soft); }

  .gs-card h2 { font-family: 'Space Grotesk', sans-serif; font-size: 22px; margin: 0 0 8px; }
  .gs-card p.desc { color: var(--muted); font-size: 14.5px; line-height: 1.55; margin: 0 0 26px; }

  .gs-btn-primary {
    width: 100%; background: var(--ink); color: #fff; border: none; border-radius: 100px;
    padding: 15px; font-weight: 700; font-size: 15px; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.01em;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  .gs-btn-primary:hover { background: var(--privacy); transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .gs-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }

  .gs-btn-secondary {
    width: 100%; background: transparent; color: var(--ink); border: 1.5px solid var(--line);
    border-radius: 100px; padding: 13px; font-weight: 600; font-size: 14.5px; cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif; margin-top: 10px; transition: border-color 0.2s ease;
  }
  .gs-btn-secondary:hover { border-color: var(--ink); }

  .gs-link-btn {
    display: inline-block; text-decoration: none; color: var(--privacy); font-weight: 600;
    font-size: 14px; margin-top: 4px;
  }

  .gs-spin {
    width: 30px; height: 30px; border-radius: 50%;
    border: 2.5px solid var(--privacy-soft); border-top-color: var(--privacy);
    animation: rotate 0.85s linear infinite; margin: 0 auto 22px;
  }
  @keyframes rotate { to { transform: rotate(360deg); } }

  .gs-trust-row {
    display: flex; justify-content: center; gap: 20px; margin-top: 22px; flex-wrap: wrap;
  }
  .gs-trust-item {
    display: flex; align-items: center; gap: 6px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--muted);
  }

  .gs-address-box {
    background: var(--fill); border: 1px solid var(--line); border-radius: 12px;
    padding: 14px 16px; margin-bottom: 22px; text-align: left;
  }
  .gs-address-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 600; color: var(--muted);
    letter-spacing: 0.08em; text-transform: uppercase; display: block; margin-bottom: 6px;
  }
  .gs-address-value {
    font-family: 'IBM Plex Mono', monospace; font-size: 14px; color: var(--ink); font-weight: 600;
    word-break: break-all;
  }

  .gs-error-box {
    background: var(--danger-soft); color: var(--danger); border-radius: 12px;
    padding: 12px 16px; font-size: 13px; margin-bottom: 20px; text-align: left; line-height: 1.5;
  }

  .gs-redirect-note {
    font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--muted); margin-top: 18px;
  }

  @media (max-width: 600px) {
    .gs-hero h1 { font-size: 30px; }
  }
`

function ShieldIcon({ size = 26, color = 'var(--accent)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M9 12l2 2 4-4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function WalletIcon({ size = 26, color = 'var(--privacy)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.6" />
      <path d="M3 9h18" stroke={color} strokeWidth="1.6" />
      <circle cx="16.5" cy="13.5" r="1.4" fill={color} />
    </svg>
  )
}

function AlertIcon({ size = 26, color = 'var(--danger)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 3l10 18H2L12 3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 10v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="16.7" r="0.9" fill={color} />
    </svg>
  )
}

function LockIcon({ size = 12, color = 'var(--privacy)' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth="1.7" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

export default function GetStartedPage() {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>('idle')
  const [address, setAddress] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>('')
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const connect = useCallback(async () => {
    setErrorMsg('')
    setStage('checking')
    try {
      const connectedResult = await freighterIsConnected()
      if (connectedResult.error || !connectedResult.isConnected) {
        setStage('no-wallet')
        return
      }

      setStage('requesting')

      const allowedResult = await freighterIsAllowed()
      if (allowedResult.error) {
        // Example: map error types to specific stages
        const errMsg = allowedResult.error.message?.toLowerCase() || ''
        if (errMsg.includes('network') || errMsg.includes('connection')) {
          setStage('network-error')
        } else if (errMsg.includes('revoked')) {
          setStage('identity-revoked')
        } else if (errMsg.includes('registered') || errMsg.includes('not found')) {
          setStage('identity-not-registered')
        } else {
          setStage('error')
          setErrorMsg(allowedResult.error.message || 'Freighter returned an error while checking permissions.')
        }
        return
      }
      if (!allowedResult.isAllowed) {
        const setAllowedResult = await freighterSetAllowed()
        if (setAllowedResult.error || !setAllowedResult.isAllowed) {
          setStage('error')
          setErrorMsg('Access was declined in Freighter. Approve the connection request to continue.')
          return
        }
      }

      const addressResult = await freighterGetAddress()
      if (addressResult.error || !addressResult.address) {
        // Example: map address result errors to specific stages
        const errMsg = addressResult.error?.message?.toLowerCase() || ''
        if (errMsg.includes('network') || errMsg.includes('connection')) {
          setStage('network-error')
        } else if (errMsg.includes('revoked')) {
          setStage('identity-revoked')
        } else if (errMsg.includes('registered') || errMsg.includes('not found')) {
          setStage('identity-not-registered')
        } else {
          setStage('error')
          setErrorMsg(addressResult.error?.message || 'Could not retrieve a wallet address from Freighter.')
        }
        return
      }

      window.localStorage.setItem(WALLET_STORAGE_KEY, addressResult.address)
      setAddress(addressResult.address)
      setStage('connected')

      redirectTimer.current = setTimeout(() => {
        router.push(SWAP_ROUTE)
      }, 1400)
    } catch (err) {
      const errMsg = err instanceof Error ? err.message?.toLowerCase() : ''
      if (errMsg?.includes('network') || errMsg?.includes('connection')) {
        setStage('network-error')
      } else {
        setStage('error')
        setErrorMsg(err instanceof Error ? err.message : 'Something went wrong connecting to Freighter.')
      }
    }
  }, [router])

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
    }
  }, [])

  return (
    <div className="gs-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />

      <div className="gs-blob gs-blob-1" />
      <div className="gs-blob gs-blob-2" />

      <div className="gs-hero">
        <div className="gs-eyebrow fade-up"><span className="gs-dot" /> Non-custodial · Stellar network</div>
        <h1 className="fade-up" style={{ animationDelay: '0.05s' }}>Connect your wallet to get started</h1>
        <p className="fade-up" style={{ animationDelay: '0.1s' }}>
          SwiftRamp never holds your funds or your keys. Connect Freighter to sign your own
          transfers — we only ever see a zero-knowledge proof, never your balance.
        </p>
      </div>

      <div className="gs-card-wrap fade-up" style={{ animationDelay: '0.18s' }}>
        {stage === 'idle' && (
          <div className="gs-card">
            <div className="gs-wallet-icon privacy"><WalletIcon /></div>
            <h2 className="display">Connect Freighter</h2>
            <p className="desc">
              Freighter is a browser-extension wallet for Stellar. You'll approve the
              connection there — SwiftRamp never sees your secret key.
            </p>
            <button className="gs-btn-primary" onClick={connect}>
              <WalletIcon size={16} color="#fff" /> Connect wallet
            </button>
            <div className="gs-trust-row">
              <div className="gs-trust-item"><LockIcon /> Keys stay on your device</div>
            </div>
          </div>
        )}

        {(stage === 'checking' || stage === 'requesting') && (
          <div className="gs-card">
            <div className="gs-spin" />
            <h2 className="display">{stage === 'checking' ? 'Looking for Freighter…' : 'Waiting for approval…'}</h2>
            <p className="desc">
              {stage === 'checking'
                ? 'Checking for the Freighter extension in your browser.'
                : 'Check the Freighter popup and approve the connection to continue.'}
            </p>
          </div>
        )}

        {stage === 'no-wallet' && (
          <div className="gs-card">
            <div className="gs-wallet-icon"><ShieldIcon /></div>
            <h2 className="display">Freighter not found</h2>
            <p className="desc">
              We couldn't detect the Freighter wallet extension. Install it, refresh this
              page, then connect again.
            </p>
            <a
              className="gs-btn-primary"
              style={{ textDecoration: 'none' }}
              href="https://www.freighter.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install Freighter →
            </a>
            <button className="gs-btn-secondary" onClick={connect}>I've installed it — retry</button>
          </div>
        )}

        {stage === 'error' && (
          <div className="gs-card">
            <div className="gs-wallet-icon error"><AlertIcon /></div>
            <h2 className="display">Couldn't connect</h2>
            <div className="gs-error-box">{errorMsg}</div>
            <button className="gs-btn-primary" onClick={connect}>Try again</button>
          </div>
        )}

        {stage === 'identity-not-registered' && (
          <div className="gs-card">
            <div className="gs-wallet-icon error"><AlertIcon /></div>
            <h2 className="display">Identity not registered</h2>
            <p className="desc">
              We couldn't find your registered identity. Please register your identity and try again.
            </p>
            <button className="gs-btn-primary" onClick={connect}>Try again</button>
          </div>
        )}

        {stage === 'identity-revoked' && (
          <div className="gs-card">
            <div className="gs-wallet-icon error"><AlertIcon /></div>
            <h2 className="display">Identity revoked</h2>
            <p className="desc">
              Your identity has been revoked. Please contact support or re-register your identity.
            </p>
            <button className="gs-btn-primary" onClick={connect}>Try again</button>
          </div>
        )}

        {stage === 'network-error' && (
          <div className="gs-card">
            <div className="gs-wallet-icon error"><AlertIcon /></div>
            <h2 className="display">Network error</h2>
            <p className="desc">
              We're having trouble connecting to the network. Please check your connection and try again.
            </p>
            <button className="gs-btn-primary" onClick={connect}>Try again</button>
          </div>
        )}

        {stage === 'connected' && address && (
          <div className="gs-card">
            <div className="gs-wallet-icon privacy"><ShieldIcon color="var(--privacy)" /></div>
            <h2 className="display">Wallet connected</h2>
            <p className="desc">Taking you to the swap screen.</p>
            <div className="gs-address-box">
              <span className="gs-address-label">Connected address</span>
              <span className="gs-address-value mono">{truncate(address)}</span>
            </div>
            <button className="gs-btn-primary" onClick={() => router.push(SWAP_ROUTE)}>
              Continue to swap →
            </button>
            <div className="gs-redirect-note">Redirecting automatically…</div>
          </div>
        )}
      </div>
    </div>
  )
}