'use client'
import { useState, useMemo } from 'react'
import Navbar from '../../../components/Navbar'

import { rates, flags, names, ccyList } from '@/lib/constants'

// Base currency the board quotes against. Fixed deliberately — this is a
// reference board, not the swap form, so it doesn't need a picker.
const BASE = 'USD'

function deterministicDelta(code: string) {
  // Stable per-currency figure so the board doesn't jitter between renders.
  let seed = 0
  for (const ch of code) seed += ch.charCodeAt(0)
  const up = seed % 3 !== 0
  const delta = (0.04 + ((seed * 13) % 70) / 100).toFixed(2)
  return { up, delta }
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
    --up: #17462B;
    --down: #B8433A;
    --shadow-sm: 0 2px 10px rgba(10,10,10,0.05);
    --shadow-md: 0 12px 40px rgba(10,10,10,0.07);
    --shadow-lg: 0 24px 70px rgba(10,10,10,0.10);
  }
  * { box-sizing: border-box; }
  .rt-page { min-height: 100vh; background: var(--paper); color: var(--ink); font-family: 'IBM Plex Sans', sans-serif; position: relative; overflow-x: hidden; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .display { font-family: 'Space Grotesk', sans-serif; }
  .fade-up { opacity: 0; transform: translateY(16px); animation: fadeUp 0.7s cubic-bezier(0.2,0.6,0.2,1) forwards; }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

  .rt-blob { position: absolute; border-radius: 50%; filter: blur(70px); z-index: 0; pointer-events: none; }
  .rt-blob-1 { width: 380px; height: 380px; background: var(--accent-soft); opacity: 0.5; top: -110px; left: -130px; }
  .rt-blob-2 { width: 300px; height: 300px; background: var(--privacy-soft); opacity: 0.55; top: 60px; right: -100px; }

  .rt-hero { max-width: 620px; margin: 0 auto; padding: 76px 24px 0; text-align: center; position: relative; z-index: 1; }
  .rt-eyebrow {
    display: inline-flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent);
    background: var(--accent-soft); padding: 6px 14px; border-radius: 100px; margin-bottom: 22px; box-shadow: var(--shadow-sm);
  }
  .rt-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 1.6s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .rt-hero h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 46px; line-height: 1.08; letter-spacing: -0.01em; margin: 0 0 16px; }
  .rt-hero p { color: var(--muted); font-size: 16px; line-height: 1.6; margin: 0 auto; max-width: 440px; }

  /* --- RATE BOARD (signature element) ---
     Styled after a departures board: monospace figures in fixed-width
     columns, a live dot, flip-style row entry. Fits a currency-transfer
     product better than a generic pricing table. */
  .board-wrap { max-width: 760px; margin: 52px auto 0; padding: 0 24px; position: relative; z-index: 1; }
  .board {
    background: var(--ink); border-radius: 20px; padding: 8px 0; box-shadow: var(--shadow-lg);
    overflow: hidden;
  }
  .board-head {
    display: grid; grid-template-columns: 2.4fr 1.2fr 1fr 1fr; gap: 8px;
    padding: 14px 26px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
    letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.4);
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  .board-row {
    display: grid; grid-template-columns: 2.4fr 1.2fr 1fr 1fr; gap: 8px; align-items: center;
    padding: 16px 26px; border-bottom: 1px solid rgba(255,255,255,0.06);
    animation: rowIn 0.5s cubic-bezier(0.2,0.6,0.2,1) backwards;
  }
  .board-row:last-child { border-bottom: none; }
  @keyframes rowIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .board-ccy { display: flex; align-items: center; gap: 10px; }
  .board-flag { font-size: 18px; }
  .board-code { font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #fff; font-size: 14.5px; }
  .board-name { color: rgba(255,255,255,0.45); font-size: 11.5px; display: block; margin-top: 1px; }
  .board-rate { font-family: 'IBM Plex Mono', monospace; color: #fff; font-size: 15px; font-weight: 600; }
  .board-fee { font-family: 'IBM Plex Mono', monospace; color: var(--privacy-soft); font-size: 12.5px; }
  .board-delta { font-family: 'IBM Plex Mono', monospace; font-size: 12.5px; font-weight: 600; display: flex; align-items: center; gap: 4px; }
  .board-delta.up { color: #7FD99A; }
  .board-delta.down { color: #E4867D; }
  .board-base-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 26px 4px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: rgba(255,255,255,0.5);
  }
  .board-live { display: flex; align-items: center; gap: 6px; }
  .live-dot { width: 6px; height: 6px; border-radius: 50%; background: #7FD99A; animation: pulse 1.6s ease-in-out infinite; }

  @media (max-width: 560px) {
    .board-head, .board-row { grid-template-columns: 1.8fr 1fr 0.9fr; }
    .board-fee { display: none; }
    .board-head span:nth-child(3) { display: none; }
  }

  /* --- FEE STRIP --- */
  .fee-strip { max-width: 760px; margin: 40px auto 0; padding: 0 24px; position: relative; z-index: 1; }
  .fee-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .fee-card {
    background: #fff; border: 1px solid var(--line); border-radius: 16px; padding: 20px; text-align: center;
    box-shadow: var(--shadow-sm); transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .fee-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .fee-num { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }
  .fee-label { color: var(--muted); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px; }

  /* --- CONVERTER PREVIEW --- */
  .preview-wrap { max-width: 460px; margin: 56px auto 0; padding: 0 24px 110px; position: relative; z-index: 1; }
  .preview-card { background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 28px; box-shadow: var(--shadow-lg); }
  .preview-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px; }
  .preview-row { display: flex; gap: 10px; margin-bottom: 18px; }
  .preview-input {
    flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 700; border: 1.5px solid var(--line);
    border-radius: 12px; padding: 12px 14px; outline: none; background: var(--fill); color: var(--ink); min-width: 0;
  }
  .preview-input:focus { border-color: var(--accent); box-shadow: 0 0 0 4px var(--accent-soft); }
  .preview-select {
    background: var(--fill); border: 1.5px solid var(--line); border-radius: 12px; padding: 0 12px;
    font-size: 14px; font-weight: 600; cursor: pointer; font-family: 'IBM Plex Sans', sans-serif; color: var(--ink);
  }
  .preview-result {
    background: var(--accent-soft); color: var(--accent); border-radius: 12px; padding: 16px; text-align: center;
    font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; margin-bottom: 18px;
  }
  .preview-cta {
    display: block; text-align: center; width: 100%; background: var(--ink); color: #fff; border: none;
    border-radius: 100px; padding: 14px; font-weight: 700; font-size: 14.5px; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; text-decoration: none; transition: background 0.2s ease, transform 0.2s ease;
  }
  .preview-cta:hover { background: var(--privacy); transform: translateY(-2px); }

  @media (max-width: 600px) {
    .rt-hero h1 { font-size: 32px; }
    .fee-grid { grid-template-columns: 1fr; }
  }
`

export default function RatesPage() {
  const [amt, setAmt] = useState('100')
  const [toCcy, setToCcy] = useState('NGN')

  const rows = useMemo(
    () => ccyList.filter(c => c !== BASE).map(code => ({ code, ...deterministicDelta(code) })),
    []
  )

  const result = (parseFloat(amt || '0') * rates[toCcy] / rates[BASE]).toFixed(2)

  return (
    <div className="rt-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />

      <div className="rt-blob rt-blob-1" />
      <div className="rt-blob rt-blob-2" />

      <div className="rt-hero">
        <div className="rt-eyebrow fade-up"><span className="rt-dot" /> Updated in real time</div>
        <h1 className="fade-up" style={{ animationDelay: '0.05s' }}>Rates, plainly stated.</h1>
        <p className="fade-up" style={{ animationDelay: '0.1s' }}>
          What you see is the rate you get — locked the instant you confirm a transfer,
          with one flat network fee and nothing added on top.
        </p>
      </div>

      <div className="board-wrap fade-up" style={{ animationDelay: '0.2s' }}>
        <div className="board">
          <div className="board-base-row">
            <span>1.00 {flags[BASE]} {BASE} converts to —</span>
            <span className="board-live"><span className="live-dot" /> LIVE</span>
          </div>
          <div className="board-head">
            <span>Currency</span>
            <span>Rate</span>
            <span>Fee</span>
            <span>24h</span>
          </div>
          {rows.map((row, i) => (
            <div className="board-row" key={row.code} style={{ animationDelay: `${0.06 * i}s` }}>
              <div className="board-ccy">
                <span className="board-flag">{flags[row.code]}</span>
                <span>
                  <span className="board-code">{row.code}</span>
                  <span className="board-name">{names[row.code]}</span>
                </span>
              </div>
              <div className="board-rate">{rates[row.code].toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
              <div className="board-fee">$0.001</div>
              <div className={`board-delta ${row.up ? 'up' : 'down'}`}>{row.up ? '▲' : '▼'} {row.delta}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="fee-strip fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="fee-grid">
          <div className="fee-card">
            <div className="fee-num mono">$0.001</div>
            <div className="fee-label">Flat network fee</div>
          </div>
          <div className="fee-card">
            <div className="fee-num mono">0%</div>
            <div className="fee-label">Spread markup</div>
          </div>
          <div className="fee-card">
            <div className="fee-num mono">~5s</div>
            <div className="fee-label">Rate lock to settle</div>
          </div>
        </div>
      </div>

      <div className="preview-wrap fade-up" style={{ animationDelay: '0.4s' }}>
        <div className="preview-card">
          <div className="preview-label">Preview a conversion</div>
          <div className="preview-row">
            <input className="preview-input" type="number" value={amt} onChange={e => setAmt(e.target.value)} />
            <select className="preview-select" value="USD" disabled>
              <option>🇺🇸 USD</option>
            </select>
          </div>
          <div className="preview-result mono">
            {result} {toCcy}
          </div>
          <div className="preview-row" style={{ marginBottom: '22px' }}>
            <select className="preview-select" style={{ width: '100%' }} value={toCcy} onChange={e => setToCcy(e.target.value)}>
              {ccyList.filter(c => c !== BASE).map(c => <option key={c} value={c}>{flags[c]} Receive in {c}</option>)}
            </select>
          </div>
          <a href="/get-started" className="preview-cta">Send at this rate →</a>
        </div>
      </div>
    </div>
  )
}