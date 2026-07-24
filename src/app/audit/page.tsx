'use client'
import { useState, useEffect } from 'react'
import Navbar from '../../../components/Navbar'
import ProofHashDisplay from '../../../components/ProofHashDisplay'
import AuditTrailView from '../../../components/AuditTrailView'
import IdentityStatus from '../../../components/IdentityStatus'

const WALLET_STORAGE_KEY = 'swiftramp_stellar_address'

const STAR_NODES = [
  { id: 'NGN', x: 18, y: 62 },
  { id: 'GHS', x: 9, y: 30 },
  { id: 'GBP', x: 30, y: 14 },
  { id: 'USD', x: 58, y: 10 },
  { id: 'EUR', x: 84, y: 22 },
  { id: 'KES', x: 90, y: 55 },
  { id: 'ZAR', x: 66, y: 85 },
]

const STAR_EDGES = [
  ['NGN', 'GBP'], ['NGN', 'USD'], ['GHS', 'NGN'], ['USD', 'EUR'],
  ['EUR', 'KES'], ['KES', 'ZAR'], ['NGN', 'ZAR'], ['GBP', 'EUR'],
]

const HEX_CHARS = '0123456789abcdef'
function randomHex(len: number) {
  let s = ''
  for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)]
  return s
}

const CSS = `
  .audit-page {
    --sw-bg-0: #E0E0F0;
    --sw-bg-1: #D8D8E8;
    --sw-card: #FFFFFF;
    --sw-card-border: #EAEAE6;
    --sw-line: #EAEAE6;
    --sw-ink: #0A0A0A;
    --sw-muted: #6B6960;
    --sw-mint: #17462B;
    --sw-mint-soft: #DCE8DE;
    --sw-violet: #5B3DF5;
    --sw-violet-soft: #ECE8FE;
    --sw-shadow: 0 24px 70px rgba(10,10,10,0.09);
    --sw-fill: #F6F6F3;
    
    min-height: 100vh;
    background: var(--sw-bg-0);
    color: var(--sw-ink);
    font-family: 'IBM Plex Sans', sans-serif;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 80px;
    box-sizing: border-box;
  }
  .audit-page * { box-sizing: border-box; }
  
  .starfield {
    position: absolute; inset: 0; overflow: hidden; z-index: 0; pointer-events: none;
    display: flex; align-items: center; justify-content: center;
  }
  .chart-dial {
    width: min(880px, 130vw); height: min(880px, 130vw);
    transform-origin: center;
    animation: dialRotate 180s linear infinite;
  }
  @keyframes dialRotate { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) {
    .chart-dial { animation: none; }
  }
  .chart-ring { fill: none; stroke: var(--sw-line); stroke-width: 1; opacity: 0.9; }
  .chart-tick { stroke: var(--sw-line); stroke-width: 1; }
  .chart-tick.major { stroke: var(--sw-muted); opacity: 0.55; }
  .chart-degree {
    font-family: 'IBM Plex Mono', monospace; font-size: 8px; fill: var(--sw-muted);
    opacity: 0.45; letter-spacing: 0.04em;
  }
  .const-edge { stroke: var(--sw-violet); stroke-width: 0.6; fill: none; opacity: 0.16; }
  .const-star .node-dot { fill: var(--sw-ink); }
  .const-star .code {
    font-family: 'IBM Plex Mono', monospace; font-size: 9px; fill: var(--sw-ink);
    font-weight: 600; letter-spacing: 0.03em; opacity: 0.7;
  }
  .twinkle { animation: twinkle 4.5s ease-in-out infinite; }
  @keyframes twinkle { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
  
  .fade-up { opacity: 0; transform: translateY(14px); animation: fadeUp 0.7s cubic-bezier(0.2,0.6,0.2,1) forwards; }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

  .audit-container {
    position: relative;
    z-index: 2;
    max-width: 1040px;
    margin: 0 auto;
    padding: 40px 24px 0;
  }

  .audit-header {
    text-align: center;
    margin-bottom: 40px;
  }
  .audit-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--sw-violet); background: var(--sw-violet-soft);
    padding: 6px 14px; border-radius: 100px; margin-bottom: 20px;
  }
  .audit-header h1 {
    font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 38px; line-height: 1.1; margin: 0 0 10px;
  }
  .audit-header p {
    color: var(--sw-muted); font-size: 16px; line-height: 1.6; margin: 0 auto; max-width: 520px;
  }

  .simulation-bar {
    background: var(--sw-card);
    border: 1.5px solid var(--sw-card-border);
    border-radius: 18px;
    padding: 18px 24px;
    margin-bottom: 30px;
    box-shadow: var(--sw-shadow);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }
  .sim-title-group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .sim-dot {
    width: 8px;
    height: 8px;
    background: var(--sw-violet);
    border-radius: 50%;
    animation: simPulse 1.5s infinite;
  }
  @keyframes simPulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.4; }
  }
  .sim-title {
    font-family: 'Space Grotesk', sans-serif;
    font-weight: 700;
    font-size: 15px;
    color: var(--sw-ink);
  }
  .sim-controls {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .sim-btn {
    background: linear-gradient(135deg, var(--sw-violet), #6F5CE0);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }
  .sim-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(91,61,245,0.25);
  }
  .sim-btn.active {
    background: #17462B;
  }
  .sim-input {
    border: 1px solid var(--sw-card-border);
    background: var(--sw-fill);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 12px;
    font-family: 'IBM Plex Mono', monospace;
    width: 260px;
    outline: none;
    color: var(--sw-ink);
  }
  .sim-input:focus {
    border-color: var(--sw-violet);
  }

  .audit-grid {
    display: grid;
    grid-template-cols: 1fr;
    gap: 30px;
  }
  @media (min-width: 840px) {
    .audit-grid {
      grid-template-cols: 1.1fr 0.9fr;
    }
  }

  .audit-column {
    display: flex;
    flex-direction: column;
    gap: 30px;
  }
`

export default function AuditPage() {
  const [isClient, setIsClient] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [walletAddress, setWalletAddress] = useState('')
  const [proofHex, setProofHex] = useState('')

  useEffect(() => {
    setIsClient(true)
    const storedAddress = window.localStorage.getItem(WALLET_STORAGE_KEY)
    if (storedAddress) {
      setWalletAddress(storedAddress)
    } else {
      setWalletAddress('GB3FUXLN27QJAX2K5HTZ2ANON7VUT4673UCDZVERIFIABLESTEL')
    }

    setProofHex('0x' + randomHex(48))

    // Simulate initial load to show skeletons beautifully
    const t = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const starById = (id: string) => STAR_NODES.find(n => n.id === id)!

  const triggerReload = () => {
    setIsLoading(true)
    setTimeout(() => {
      setProofHex('0x' + randomHex(48))
      setIsLoading(false)
    }, 1200)
  }

  return (
    <div className="audit-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />

      <div className="starfield">
        <svg className="chart-dial" viewBox="0 0 400 400">
          <circle className="chart-ring" cx="200" cy="200" r="180" />
          <circle className="chart-ring" cx="200" cy="200" r="140" />
          <circle className="chart-ring" cx="200" cy="200" r="100" />
          <circle className="chart-ring" cx="200" cy="200" r="60" />

          {Array.from({ length: 72 }, (_, i) => {
            const angle = (i * 5 * Math.PI) / 180
            const major = i % 6 === 0
            const rOuter = 180
            const rInner = major ? 168 : 174
            const x1 = 200 + rOuter * Math.cos(angle), y1 = 200 + rOuter * Math.sin(angle)
            const x2 = 200 + rInner * Math.cos(angle), y2 = 200 + rInner * Math.sin(angle)
            return <line key={i} className={`chart-tick${major ? ' major' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}

          {STAR_EDGES.map(([a, b], i) => {
            const A = starById(a), B = starById(b)
            const ax = 200 + (A.x / 100) * 280 - 140, ay = 200 + (A.y / 100) * 280 - 140
            const bx = 200 + (B.x / 100) * 280 - 140, by = 200 + (B.y / 100) * 280 - 140
            return <line key={i} className="const-edge" x1={ax} y1={ay} x2={bx} y2={by} />
          })}
          {STAR_NODES.map(n => {
            const x = 200 + (n.x / 100) * 280 - 140, y = 200 + (n.y / 100) * 280 - 140
            return (
              <g key={n.id} className="const-star">
                <circle className="node-dot twinkle" cx={x} cy={y} r={2.4} style={{ animationDelay: `${n.x % 4}s` }} />
                <text x={x} y={y - 8} textAnchor="middle" className="code">{n.id}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="audit-container">
        <div className="audit-header fade-up">
          <div className="audit-eyebrow">
            <span className="sim-dot" /> On-Chain Compliance & Privacy
          </div>
          <h1>Cryptographic Audit Trail</h1>
          <p>
            Verify zero-knowledge proof validity and compliance status of Stellar transactions. All computation is validated without revealing transaction amounts.
          </p>
        </div>

        {isClient && (
          <div className="simulation-bar fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="sim-title-group">
              <span className="sim-dot" />
              <span className="sim-title">Simulation Panel</span>
            </div>
            <div className="sim-controls">
              <input
                type="text"
                className="sim-input"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="Simulate Wallet Address"
                title="Mock wallet address input"
              />
              <button
                className={`sim-btn ${isLoading ? 'active' : ''}`}
                onClick={() => setIsLoading(!isLoading)}
              >
                {isLoading ? 'Show Loaded State' : 'Simulate Loading Skeletons'}
              </button>
              <button className="sim-btn" onClick={triggerReload}>
                Generate New Proof
              </button>
            </div>
          </div>
        )}

        {isClient && (
          <div className="audit-grid fade-up" style={{ animationDelay: '0.2s' }}>
            <div className="audit-column">
              <IdentityStatus
                isLoading={isLoading}
                walletAddress={walletAddress}
              />
              <ProofHashDisplay
                isLoading={isLoading}
                proofHex={proofHex}
              />
            </div>
            <div className="audit-column">
              <AuditTrailView
                isLoading={isLoading}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
