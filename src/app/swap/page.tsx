'use client'
import { useState, useEffect, useRef } from 'react'

const rates: Record<string, number> = { NGN: 1580, KES: 130, GHS: 15.6, ZAR: 18.9, USD: 1, EUR: 0.93, GBP: 0.79 }
const flags: Record<string, string> = { NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', ZAR: '🇿🇦', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧' }
const ccyList = ['NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR']
const tickerPairs = [
  ['USD', 'NGN'], ['USD', 'KES'], ['USD', 'GHS'], ['USD', 'ZAR'], ['EUR', 'NGN'], ['GBP', 'NGN'], ['USD', 'EUR'],
]

const WALLET_STORAGE_KEY = 'swiftramp_stellar_address'

// Currency "stars" plotted like a constellation behind the card — same nodes as the
// homepage globe, reused here as quiet ambient texture rather than the hero graphic.
const STAR_NODES = [
  { id: 'NGN', x: 18, y: 62, mag: 1 },
  { id: 'GHS', x: 9, y: 30 },
  { id: 'GBP', x: 30, y: 14, mag: 1 },
  { id: 'USD', x: 58, y: 10 },
  { id: 'EUR', x: 84, y: 22 },
  { id: 'KES', x: 90, y: 55 },
  { id: 'ZAR', x: 66, y: 85 },
]
const STAR_EDGES = [
  ['NGN', 'GBP'], ['NGN', 'USD'], ['GHS', 'NGN'], ['USD', 'EUR'],
  ['EUR', 'KES'], ['KES', 'ZAR'], ['NGN', 'ZAR'], ['GBP', 'EUR'],
]

const PROOF_STEPS = [
  { label: 'Committing amount', sub: 'Pedersen commitment created locally' },
  { label: 'Generating zk-SNARK proof', sub: 'Balances proven valid, values stay hidden' },
  { label: 'Verifying on-chain', sub: 'Validator checks proof, not your data' },
]

const HEX_CHARS = '0123456789abcdef'
function randomHex(len: number) {
  let s = ''
  for (let i = 0; i < len; i++) s += HEX_CHARS[Math.floor(Math.random() * 16)]
  return s
}
function truncate(addr: string) {
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

  .swap-page {
    --sw-bg-0: #F8F0F5;
    --sw-bg-1: #F0E8EE;
    --sw-card: #FFFFFF;
    --sw-card-border: #EAEAE6;
    --sw-line: #EAEAE6;
    --sw-ink: #0A0A0A;
    --sw-muted: #6B6960;
    --sw-mint: #17462B;
    --sw-mint-soft: #DCE8DE;
    --sw-violet: #5B3DF5;
    --sw-violet-soft: #ECE8FE;
    --sw-star: #0A0A0A;
    --sw-shadow: 0 24px 70px rgba(10,10,10,0.09);
    --sw-fill: #F6F6F3;
  }
  .swap-page * { box-sizing: border-box; }
  .swap-page {
    min-height: 100vh;
    background: var(--sw-bg-0);
    color: var(--sw-ink);
    font-family: 'IBM Plex Sans', sans-serif;
    position: relative;
    overflow-x: hidden;
    padding-bottom: 80px;
  }
  .swap-mono { font-family: 'IBM Plex Mono', monospace; }
  .swap-display { font-family: 'Space Grotesk', sans-serif; }

  /* --- CELESTIAL CHART BACKGROUND ---
     A hairline navigation dial: concentric rings, degree ticks, and the
     currency nodes plotted as points around it with thin constellation lines.
     Distinct from the homepage's warm halftone globe: precision-instrument,
     not illustration; ink-thin lines on white, not filled shapes on cream. */
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
  @media (prefers-reduced-motion: reduce) {
    .twinkle { animation: none; opacity: 0.8; }
  }

  .fade-up { opacity: 0; transform: translateY(14px); animation: fadeUp 0.7s cubic-bezier(0.2,0.6,0.2,1) forwards; }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

  /* --- TICKER TAPE --- */
  .ticker-wrap {
    position: relative; z-index: 2; width: 100%; overflow: hidden;
    background: var(--sw-fill); border-bottom: 1px solid var(--sw-line);
    padding: 9px 0;
  }
  .ticker-track {
    display: flex; width: max-content; gap: 40px; animation: tickerScroll 26s linear infinite;
  }
  @keyframes tickerScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  .ticker-item {
    display: flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; color: var(--sw-muted); white-space: nowrap;
  }
  .ticker-item .pair { color: var(--sw-ink); font-weight: 600; }
  .ticker-item .up { color: var(--sw-mint); }
  .ticker-item .down { color: #B8433A; }

  /* --- TOP BAR (minimal, not the marketing navbar) --- */
  .swap-topbar {
    position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between;
    padding: 20px 32px; max-width: 1040px; margin: 0 auto;
  }
  .swap-brand { display: flex; align-items: center; gap: 9px; text-decoration: none; color: var(--sw-ink); }
  .swap-brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--sw-violet); box-shadow: 0 0 10px 2px var(--sw-violet-soft); }
  .swap-brand-word { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16px; letter-spacing: 0.02em; }
  .swap-brand-word span { color: var(--sw-mint); }
  .swap-back {
    font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: var(--sw-muted);
    text-decoration: none; display: flex; align-items: center; gap: 6px; transition: color 0.2s ease;
  }
  .swap-back:hover { color: var(--sw-ink); }

  /* --- HERO --- */
  .swap-hero { position: relative; z-index: 2; max-width: 560px; margin: 0 auto; padding: 34px 24px 0; text-align: center; }
  .swap-eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--sw-violet); background: var(--sw-violet-soft);
    padding: 6px 14px; border-radius: 100px; margin-bottom: 20px;
  }
  .swap-dot-live { width: 6px; height: 6px; border-radius: 50%; background: var(--sw-violet); animation: pulseDot 1.6s ease-in-out infinite; }
  @keyframes pulseDot { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .swap-hero h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 34px; line-height: 1.1; margin: 0 0 10px; }
  .swap-hero p { color: var(--sw-muted); font-size: 15px; line-height: 1.6; margin: 0 auto; max-width: 400px; }

  /* --- WALLET CHIP --- */
  .wallet-chip {
    position: relative; z-index: 2;
    display: flex; align-items: center; justify-content: space-between; gap: 10px;
    max-width: 440px; margin: 26px auto 0; padding: 10px 16px;
    background: var(--sw-fill); border: 1px solid var(--sw-card-border); border-radius: 100px;
    font-family: 'IBM Plex Mono', monospace; font-size: 12px;
  }
  .wallet-chip .addr { display: flex; align-items: center; gap: 7px; color: var(--sw-ink); font-weight: 600; }
  .wallet-chip button {
    background: none; border: none; color: var(--sw-muted); font-family: 'IBM Plex Mono', monospace;
    font-size: 11.5px; cursor: pointer; text-decoration: underline; padding: 0;
  }
  .wallet-chip button:hover { color: var(--sw-ink); }

  /* --- CARD --- */
  .swap-card-wrap { position: relative; z-index: 2; max-width: 440px; margin: 22px auto 0; padding: 0 24px; }
  .glass-card {
    background: var(--sw-card); border: 1px solid var(--sw-card-border); border-radius: 22px;
    padding: 30px; box-shadow: var(--sw-shadow);
    position: relative; animation: fadeUp 0.5s cubic-bezier(0.2,0.6,0.2,1);
    transition: box-shadow 0.3s ease, transform 0.3s ease;
  }
  .glass-card:hover { box-shadow: 0 30px 90px rgba(10,10,10,0.13); transform: translateY(-2px); }
  .glass-tag {
    position: absolute; top: -12px; right: 22px;
    display: flex; align-items: center; gap: 6px;
    background: var(--sw-violet); color: #fff; border-radius: 100px;
    padding: 5px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
    font-weight: 600; letter-spacing: 0.05em; box-shadow: 0 6px 20px rgba(91,61,245,0.3);
  }
  .field-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 600; color: var(--sw-muted);
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .field-row { display: flex; gap: 10px; margin-top: 10px; }
  .amount-input {
    flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700;
    border: 1.5px solid var(--sw-line); border-radius: 12px; padding: 13px 15px; outline: none;
    background: var(--sw-fill); color: var(--sw-ink); min-width: 0;
    transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .amount-input:focus { border-color: var(--sw-violet); box-shadow: 0 0 0 4px var(--sw-violet-soft); }
  .receive-box {
    flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 28px; font-weight: 700;
    background: var(--sw-mint-soft); color: var(--sw-mint); border-radius: 12px; padding: 13px 15px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  .ccy-select {
    background: var(--sw-fill); border: 1.5px solid var(--sw-line); border-radius: 12px;
    padding: 0 12px; font-size: 14px; font-weight: 600; cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif; color: var(--sw-ink); transition: border-color 0.2s ease;
  }
  .ccy-select:hover { border-color: var(--sw-violet); }
  .ccy-select option { background: #FFFFFF; color: var(--sw-ink); }
  .swap-divider { text-align: center; color: var(--sw-muted); font-size: 17px; margin: 12px 0; }
  .rate-bar {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--sw-fill); border: 1px solid var(--sw-line); border-radius: 12px;
    padding: 13px 15px; margin: 22px 0 20px; font-family: 'IBM Plex Mono', monospace; font-size: 12px;
  }
  .rate-bar .shielded { color: var(--sw-violet); font-weight: 600; display: flex; align-items: center; gap: 5px; }
  .send-btn {
    width: 100%; background: linear-gradient(135deg, var(--sw-violet), #6F5CE0); color: #fff; border: none; border-radius: 14px;
    padding: 17px; font-size: 15.5px; font-weight: 700; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.01em;
    transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
    text-decoration: none;
  }
  .send-btn:hover { filter: brightness(1.08); transform: translateY(-2px); box-shadow: 0 14px 40px rgba(91,61,245,0.35); }
  .send-btn:active { transform: translateY(0); }

  .btn-ghost {
    width: 100%; background: transparent; color: var(--sw-ink); border: 1.5px solid var(--sw-line);
    border-radius: 100px; padding: 12px; font-weight: 600; font-size: 13.5px; cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif; margin-top: 10px; transition: border-color 0.2s ease;
  }
  .btn-ghost:hover { border-color: var(--sw-violet); }

  /* --- CONNECT REQUIRED --- */
  .connect-card { text-align: center; }
  .connect-card .icon-wrap {
    width: 56px; height: 56px; border-radius: 16px; margin: 0 auto 18px;
    background: var(--sw-violet-soft); display: flex; align-items: center; justify-content: center;
  }
  .connect-card h2 { font-family: 'Space Grotesk', sans-serif; font-size: 20px; margin: 0 0 8px; }
  .connect-card p { color: var(--sw-muted); font-size: 13.5px; line-height: 1.55; margin: 0 0 22px; }

  /* --- PROOF STATE --- */
  .proof-header { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
  .proof-spin {
    width: 32px; height: 32px; border-radius: 50%;
    border: 2.5px solid var(--sw-violet-soft); border-top-color: var(--sw-violet);
    animation: rotate 0.9s linear infinite; flex-shrink: 0;
  }
  @keyframes rotate { to { transform: rotate(360deg); } }
  .proof-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 18px; margin: 0; }
  .proof-header p { color: var(--sw-muted); font-size: 12px; margin: 2px 0 0; }
  .proof-hex {
    font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; color: var(--sw-violet);
    background: var(--sw-violet-soft); border-radius: 10px; padding: 12px 14px;
    margin-bottom: 20px; word-break: break-all; line-height: 1.6;
  }
  .proof-steps { display: flex; flex-direction: column; gap: 15px; }
  .proof-step { display: flex; align-items: flex-start; gap: 12px; opacity: 0.32; transition: opacity 0.3s ease; }
  .proof-step.active, .proof-step.done { opacity: 1; }
  .step-mark {
    width: 21px; height: 21px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
    display: flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--sw-line); font-size: 11px; font-weight: 700;
    transition: all 0.25s ease; color: transparent;
  }
  .proof-step.active .step-mark { border-color: var(--sw-violet); box-shadow: 0 0 0 4px var(--sw-violet-soft); }
  .proof-step.active .step-mark::after {
    content: ''; width: 7px; height: 7px; border-radius: 50%; background: var(--sw-violet);
    animation: pulseDot 1s ease-in-out infinite;
  }
  .proof-step.done .step-mark { background: var(--sw-violet); border-color: var(--sw-violet); color: #fff; }
  .step-text .step-label { font-weight: 600; font-size: 13.5px; }
  .step-text .step-sub { color: var(--sw-muted); font-size: 11.5px; margin-top: 1px; font-family: 'IBM Plex Mono', monospace; }

  /* --- SUCCESS --- */
  .success-card { text-align: center; }
  .success-mark {
    width: 52px; height: 52px; border-radius: 50%; background: var(--sw-mint-soft);
    color: var(--sw-mint); display: flex; align-items: center; justify-content: center;
    margin: 0 auto 18px; font-size: 24px; font-weight: 700;
    animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  .success-card h2 { font-family: 'Space Grotesk', sans-serif; font-size: 24px; margin: 0 0 8px; }
  .success-card p { color: var(--sw-muted); margin: 0 0 16px; font-size: 14px; }
  .zk-verified-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--sw-mint-soft); color: var(--sw-mint); border-radius: 100px;
    padding: 6px 14px; font-family: 'IBM Plex Mono', monospace; font-size: 11px;
    font-weight: 600; margin-bottom: 20px;
  }
  .tx-row {
    background: var(--sw-fill); border: 1px solid var(--sw-line); border-radius: 10px;
    padding: 13px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--sw-muted);
    margin-bottom: 20px; word-break: break-all; text-align: left;
  }
  .tx-row .tx-label { color: var(--sw-ink); font-weight: 600; display: block; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }

  @media (max-width: 600px) {
    .swap-hero h1 { font-size: 27px; }
    .swap-topbar { padding: 16px 20px; }
  }
`

function ShieldIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M9 12l2 2 4-4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function LockIcon({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke={color} strokeWidth="1.7" />
      <path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}
function WalletIcon({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="13" rx="2.5" stroke={color} strokeWidth="1.6" />
      <path d="M3 9h18" stroke={color} strokeWidth="1.6" />
      <circle cx="16.5" cy="13.5" r="1.4" fill={color} />
    </svg>
  )
}
function ArrowLeftIcon({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 12H5M11 6l-6 6 6 6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function SwapPage() {
  const [isClient, setIsClient] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [sendAmt, setSendAmt] = useState('100')
  const [fromCcy, setFromCcy] = useState('USD')
  const [toCcy, setToCcy] = useState('NGN')
  const [status, setStatus] = useState<'idle' | 'proving' | 'sent'>('idle')
  const [proofStepIdx, setProofStepIdx] = useState(-1)
  const [proofHex, setProofHex] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    setIsClient(true)
    const stored = window.localStorage.getItem(WALLET_STORAGE_KEY)
    if (stored) setWalletAddress(stored)
  }, [])

  const receive = (parseFloat(sendAmt || '0') * rates[toCcy] / rates[fromCcy]).toFixed(2)
  const starById = (id: string) => STAR_NODES.find(n => n.id === id)!

  useEffect(() => {
    if (isClient && !proofHex) setProofHex(randomHex(48))
  }, [isClient, proofHex])

  useEffect(() => {
    if (status !== 'proving') return
    timers.current.forEach(clearTimeout)
    timers.current = []
    setProofStepIdx(-1)
    PROOF_STEPS.forEach((_, i) => {
      const t = setTimeout(() => {
        setProofStepIdx(i)
        setProofHex(randomHex(48))
      }, 480 + i * 620)
      timers.current.push(t)
    })
    const finish = setTimeout(() => setStatus('sent'), 480 + PROOF_STEPS.length * 620 + 380)
    timers.current.push(finish)
    return () => timers.current.forEach(clearTimeout)
  }, [status])

  const handleSend = () => { if (walletAddress) setStatus('proving') }
  const reset = () => { setStatus('idle'); setProofHex('') }
  const disconnect = () => {
    window.localStorage.removeItem(WALLET_STORAGE_KEY)
    setWalletAddress(null)
    setStatus('idle')
  }

  return (
    <div className="swap-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="starfield">
        <svg className="chart-dial" viewBox="0 0 400 400">
          {/* concentric rings, like a sextant dial */}
          <circle className="chart-ring" cx="200" cy="200" r="180" />
          <circle className="chart-ring" cx="200" cy="200" r="140" />
          <circle className="chart-ring" cx="200" cy="200" r="100" />
          <circle className="chart-ring" cx="200" cy="200" r="60" />

          {/* degree ticks around the perimeter */}
          {Array.from({ length: 72 }, (_, i) => {
            const angle = (i * 5 * Math.PI) / 180
            const major = i % 6 === 0
            const rOuter = 180
            const rInner = major ? 168 : 174
            const x1 = 200 + rOuter * Math.cos(angle), y1 = 200 + rOuter * Math.sin(angle)
            const x2 = 200 + rInner * Math.cos(angle), y2 = 200 + rInner * Math.sin(angle)
            return <line key={i} className={`chart-tick${major ? ' major' : ''}`} x1={x1} y1={y1} x2={x2} y2={y2} />
          })}
          {[0, 60, 120, 180, 240, 300].map(deg => {
            const angle = (deg * Math.PI) / 180
            const x = 200 + 154 * Math.cos(angle), y = 200 + 154 * Math.sin(angle)
            return <text key={deg} className="chart-degree" x={x} y={y} textAnchor="middle">{deg}°</text>
          })}

          {/* currency nodes plotted around the dial, joined by fine lines */}
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
                <circle className="node-dot twinkle" cx={x} cy={y} r={n.mag ? 3.2 : 2.4} style={{ animationDelay: `${n.x % 4}s` }} />
                <text x={x} y={y - 8} textAnchor="middle" className="code">{n.id}</text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="ticker-wrap">
        <div className="ticker-track">
          {[...tickerPairs, ...tickerPairs].map(([a, b], i) => {
            const up = i % 3 !== 0
            const delta = (0.05 + ((i * 37) % 80) / 100).toFixed(2)
            return (
              <span className="ticker-item" key={i}>
                <span className="pair">{flags[a]}{a}/{flags[b]}{b}</span>
                <span>{(rates[b] / rates[a]).toFixed(2)}</span>
                <span className={up ? 'up' : 'down'}>{up ? '▲' : '▼'} {delta}%</span>
              </span>
            )
          })}
        </div>
      </div>

      <div className="swap-topbar">
        <a href="/" className="swap-brand">
          <span className="swap-brand-dot" />
          <span className="swap-brand-word">Swift<span>Ramp</span></span>
        </a>
        <a href="/" className="swap-back"><ArrowLeftIcon /> Back to home</a>
      </div>

      <div className="swap-hero">
        <div className="swap-eyebrow fade-up"><span className="swap-dot-live" /> Zero-knowledge private transfer</div>
        <h1 className="fade-up swap-display" style={{ animationDelay: '0.05s' }}>Chart your transfer.</h1>
        <p className="fade-up" style={{ animationDelay: '0.1s' }}>
          Every transfer here is proven with a zk-SNARK before it ever reaches Stellar's
          ledger — the amount stays yours to know.
        </p>
      </div>

      {isClient && walletAddress && (
        <div className="wallet-chip fade-up" style={{ animationDelay: '0.15s' }}>
          <span className="addr"><WalletIcon size={13} color="var(--sw-violet)" /> {truncate(walletAddress)}</span>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}

      <div className="swap-card-wrap fade-up" style={{ animationDelay: '0.2s' }}>
        {isClient && !walletAddress && (
          <div className="glass-card connect-card">
            <div className="icon-wrap"><ShieldIcon size={24} color="var(--sw-violet)" /></div>
            <h2 className="swap-display">Connect a wallet to send</h2>
            <p>You'll need a Stellar wallet connected before you can convert and send funds.</p>
            <a href="/get-started" className="send-btn">
              <WalletIcon size={15} color="#fff" /> Connect wallet
            </a>
          </div>
        )}

        {isClient && walletAddress && status === 'idle' && (
          <div className="glass-card">
            <div className="glass-tag"><ShieldIcon size={11} color="#fff" /> ZK-shielded</div>

            <div className="field-label">You send</div>
            <div className="field-row">
              <input type="number" value={sendAmt} onChange={e => setSendAmt(e.target.value)} className="amount-input" />
              <select value={fromCcy} onChange={e => setFromCcy(e.target.value)} className="ccy-select">
                {ccyList.map(c => <option key={c} value={c}>{flags[c]} {c}</option>)}
              </select>
            </div>

            <div className="swap-divider">⇅</div>

            <div className="field-label">They receive</div>
            <div className="field-row">
              <div className="receive-box swap-mono">{receive}</div>
              <select value={toCcy} onChange={e => setToCcy(e.target.value)} className="ccy-select">
                {ccyList.map(c => <option key={c} value={c}>{flags[c]} {c}</option>)}
              </select>
            </div>

            <div className="rate-bar">
              <span style={{ color: 'var(--sw-muted)' }}>1 {fromCcy} = {(rates[toCcy] / rates[fromCcy]).toFixed(4)} {toCcy}</span>
              <span className="shielded"><LockIcon size={11} color="var(--sw-violet)" /> Amount hidden on-chain</span>
            </div>

            <button onClick={handleSend} className="send-btn">
              <ShieldIcon size={15} color="#fff" /> Send {sendAmt || '0'} {fromCcy} →
            </button>
          </div>
        )}

        {isClient && walletAddress && status === 'proving' && (
          <div className="glass-card">
            <div className="proof-header">
              <div className="proof-spin" />
              <div>
                <h2 className="swap-display">Generating your proof</h2>
                <p>Your amounts stay private — only validity is shared</p>
              </div>
            </div>
            <div className="proof-hex">0x{proofHex}</div>
            <div className="proof-steps">
              {PROOF_STEPS.map((step, i) => (
                <div key={step.label} className={`proof-step ${i < proofStepIdx ? 'done' : i === proofStepIdx ? 'active' : ''}`}>
                  <div className="step-mark">{i < proofStepIdx ? '✓' : ''}</div>
                  <div className="step-text">
                    <div className="step-label">{step.label}</div>
                    <div className="step-sub">{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isClient && walletAddress && status === 'sent' && (
          <div className="glass-card success-card">
            <div className="success-mark">✓</div>
            <h2 className="swap-display">Sent</h2>
            <p>{receive} {toCcy} is on its way · Arrives in ~5 seconds</p>
            <div className="zk-verified-badge"><ShieldIcon size={12} color="var(--sw-mint)" /> zk-SNARK proof verified</div>
            <div className="tx-row">
              <span className="tx-label">Transaction</span>
              stellar.expert/tx/a3f...9bc
            </div>
            <div className="tx-row">
              <span className="tx-label">Proof commitment (amount stays private)</span>
              0x{proofHex}
            </div>
            <button onClick={reset} className="btn-ghost">Send another</button>
          </div>
        )}
      </div>
    </div>
  )
}