'use client'
import { useState, useEffect, useRef } from 'react'
import Navbar from '../../components/Navbar'

const rates: Record<string, number> = { NGN: 1580, KES: 130, GHS: 15.6, ZAR: 18.9, USD: 1, EUR: 0.93, GBP: 0.79 }
const flags: Record<string, string> = { NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', ZAR: '🇿🇦', USD: '🇺🇸', EUR: '🇪🇺', GBP: '🇬🇧' }
const ccyList = ['NGN', 'KES', 'GHS', 'ZAR', 'USD', 'EUR']

// Abstract nodes scattered across a globe silhouette — positions are illustrative, not a real map
const nodes = [
  { id: 'NGN', x: 150, y: 195, r: 30 },
  { id: 'GHS', x: 98, y: 275, r: 26 },
  { id: 'GBP', x: 220, y: 92, r: 27 },
  { id: 'USD', x: 392, y: 68, r: 30 },
  { id: 'EUR', x: 502, y: 152, r: 27 },
  { id: 'KES', x: 430, y: 292, r: 27 },
  { id: 'ZAR', x: 300, y: 332, r: 26 },
]
const edges = [
  ['NGN', 'GBP'], ['NGN', 'USD'], ['GHS', 'NGN'], ['USD', 'EUR'],
  ['EUR', 'KES'], ['KES', 'ZAR'], ['NGN', 'ZAR'], ['GBP', 'EUR'],
]
const GLOBE_CX = 320, GLOBE_CY = 200, GLOBE_R = 215

// Steps shown while a "zero-knowledge proof" is generated for a transfer.
// Purely presentational — communicates the privacy story of the product.
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

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');

  :root {
    --ink: #0A0A0A;
    --paper: #FFFFFF;
    --paper-2: #FFFFFF;
    --line: #EAEAE6;
    --muted: #6B6960;
    --accent: #17462B;
    --accent-soft: #DCE8DE;
    --privacy: #5B3DF5;
    --privacy-soft: #ECE8FE;
    --fill: #F6F6F3;
    --shadow-sm: 0 2px 10px rgba(10,10,10,0.05);
    --shadow-md: 0 12px 40px rgba(10,10,10,0.07);
    --shadow-lg: 0 24px 70px rgba(10,10,10,0.10);
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  .page {
    min-height: 100vh;
    background: var(--paper);
    color: var(--ink);
    font-family: 'IBM Plex Sans', sans-serif;
    position: relative;
    overflow-x: hidden;
  }
  .page::before {
    content: '';
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    opacity: 0.05; mix-blend-mode: multiply;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  .blob {
    position: absolute; border-radius: 50%; filter: blur(70px); z-index: 0; pointer-events: none;
  }
  .blob-1 { width: 420px; height: 420px; background: var(--accent-soft); opacity: 0.55; top: -120px; left: -140px; }
  .blob-2 { width: 340px; height: 340px; background: var(--privacy-soft); opacity: 0.6; top: 40px; right: -120px; }
  .fade-up {
    opacity: 0; transform: translateY(16px);
    animation: fadeUp 0.7s cubic-bezier(0.2,0.6,0.2,1) forwards;
  }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .display { font-family: 'Space Grotesk', sans-serif; }

  .btn-primary {
    background: var(--ink); color: #fff; border: none; border-radius: 100px;
    padding: 12px 24px; font-weight: 600; font-size: 14px; cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif; transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-secondary {
    background: transparent; color: var(--ink); border: 1.5px solid var(--line);
    border-radius: 100px; padding: 11px 22px; font-weight: 600; font-size: 14px; cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif; transition: border-color 0.2s ease, transform 0.2s ease;
  }
  .btn-secondary:hover { border-color: var(--ink); transform: translateY(-1px); }

  /* HERO */
  .hero { max-width: 720px; margin: 0 auto; padding: 84px 24px 0; text-align: center; position: relative; z-index: 1; }
  .eyebrow-row { display: flex; justify-content: center; gap: 10px; flex-wrap: wrap; margin-bottom: 28px; }
  .eyebrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--accent); background: var(--accent-soft);
    padding: 6px 14px; border-radius: 100px;
    box-shadow: var(--shadow-sm);
  }
  .eyebrow.zk { color: var(--privacy); background: var(--privacy-soft); }
  .dot-live {
    width: 6px; height: 6px; border-radius: 50%; background: var(--accent);
    animation: pulse 1.6s ease-in-out infinite;
  }
  .zk .dot-live { background: var(--privacy); }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }

  .hero h1 {
    font-family: 'Space Grotesk', sans-serif; font-weight: 700;
    font-size: 56px; line-height: 1.04; letter-spacing: -0.01em; margin: 0 0 18px;
  }
  .hero h1 span { color: var(--accent); }
  .hero h1 .zk-word { color: var(--privacy); }
  .hero p.sub { color: var(--muted); font-size: 17px; line-height: 1.6; margin: 0 auto 36px; max-width: 480px; }

  .stats-row {
    display: flex; justify-content: center; gap: 0; margin-bottom: 8px;
  }
  .stat {
    padding: 0 24px; border-right: 1px solid var(--line); transition: transform 0.2s ease;
  }
  .stat:hover { transform: translateY(-3px); }
  .stat:last-child { border-right: none; }
  .stat-num { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }
  .stat-label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; }

  /* TRUST STRIP */
  .trust-strip {
    display: flex; justify-content: center; gap: 28px; flex-wrap: wrap;
    max-width: 720px; margin: 30px auto 0; padding: 16px 20px;
    border-top: 1px solid var(--line); border-bottom: 1px solid var(--line);
  }
  .trust-item {
    display: flex; align-items: center; gap: 7px;
    font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--muted);
    letter-spacing: 0.01em;
  }
  .trust-item svg { flex-shrink: 0; }

  /* SIGNATURE GLOBE GRAPHIC */
  .network-wrap {
    position: relative; max-width: 900px; margin: 56px auto 0; padding: 0 24px; z-index: 1;
  }
  .globe-glow circle { fill: url(#globeGlow); }
  .globe-sphere {
    fill: var(--paper-2); stroke: var(--ink); stroke-width: 1.6;
  }
  .globe-halftone {
    background-image: radial-gradient(var(--ink) 1px, transparent 1.4px);
    background-size: 13px 13px;
    -webkit-mask-image: radial-gradient(circle at 50% 50%, black 55%, transparent 78%);
    mask-image: radial-gradient(circle at 50% 50%, black 55%, transparent 78%);
    opacity: 0.14;
    position: absolute; inset: 0;
    border-radius: 50%;
  }
  .globe-grid { stroke: var(--line); stroke-width: 1; fill: none; opacity: 0.9; }
  .globe-rotate {
    transform-origin: 320px 200px;
    animation: spin 9s linear infinite;
  }
  @keyframes spin {
    0% { transform: scaleX(1); }
    50% { transform: scaleX(-1); }
    100% { transform: scaleX(1); }
  }
  .orbit-ring {
    fill: none; stroke: var(--accent); stroke-width: 1; stroke-dasharray: 2 6;
    opacity: 0.5; transform-origin: 320px 200px; animation: orbit 40s linear infinite;
  }
  .orbit-ring.privacy-ring {
    stroke: var(--privacy); stroke-dasharray: 1 5; opacity: 0.35;
    animation: orbit 60s linear infinite reverse;
  }
  @keyframes orbit { to { transform: rotate(360deg); } }

  .network-edge {
    stroke: var(--line); stroke-width: 1.4; fill: none;
  }
  .network-pulse {
    stroke: var(--accent); stroke-width: 2; fill: none;
    stroke-dasharray: 6 220; animation: travel 3.2s linear infinite;
  }
  @keyframes travel { to { stroke-dashoffset: -226; } }

  /* encrypted packet: a little hex payload that runs the same path, shielded look */
  .cipher-packet {
    font-family: 'IBM Plex Mono', monospace; font-size: 7px; fill: var(--privacy);
    opacity: 0; offset-rotate: 0deg; offset-distance: 0%;
  }
  @keyframes cipherTravel {
    0% { opacity: 0; offset-distance: 0%; }
    8% { opacity: 1; }
    92% { opacity: 1; }
    100% { opacity: 0; offset-distance: 100%; }
  }

  .network-node circle {
    fill: var(--paper-2); stroke: var(--ink); stroke-width: 1.8;
    filter: drop-shadow(0 2px 6px rgba(10,10,10,0.12));
  }
  .network-node.hub circle { fill: var(--accent-soft); stroke: var(--accent); }
  .network-node .flag { font-size: 15px; }
  .network-node .code {
    font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; font-weight: 600; fill: var(--ink);
    letter-spacing: 0.02em;
  }
  .node-shield {
    opacity: 0.9;
  }
  .node-shield-ring {
    fill: none; stroke: var(--privacy); stroke-width: 1.2; opacity: 0;
    animation: shieldPing 3.6s ease-out infinite;
  }
  @keyframes shieldPing {
    0% { opacity: 0; stroke-width: 3; }
    12% { opacity: 0.55; }
    45% { opacity: 0; stroke-width: 0.4; }
    100% { opacity: 0; }
  }

  /* center privacy badge on the globe */
  .globe-center-badge {
    opacity: 0.92;
  }
  .globe-center-badge .badge-ring {
    fill: var(--paper); stroke: var(--privacy); stroke-width: 1.4;
  }
  .globe-center-badge .badge-pulse {
    fill: none; stroke: var(--privacy); stroke-width: 1; opacity: 0.5;
    animation: shieldPing 2.8s ease-out infinite;
  }

  /* CONVERTER CARD */
  .card-wrap { max-width: 460px; margin: 40px auto 0; padding: 0 24px 100px; position: relative; z-index: 1; }
  .card {
    background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 32px;
    box-shadow: var(--shadow-lg); transition: box-shadow 0.3s ease, transform 0.3s ease;
    position: relative;
  }
  .card:hover { box-shadow: 0 30px 90px rgba(10,10,10,0.14); transform: translateY(-2px); }
  .card-privacy-tag {
    position: absolute; top: -12px; right: 24px;
    display: flex; align-items: center; gap: 6px;
    background: var(--privacy); color: #fff; border-radius: 100px;
    padding: 5px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px;
    font-weight: 600; letter-spacing: 0.05em; box-shadow: var(--shadow-sm);
  }
  .field-label {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 600; color: var(--muted);
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .field-row { display: flex; gap: 10px; margin-top: 10px; }
  .amount-input {
    flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 700;
    border: 1.5px solid var(--line); border-radius: 12px; padding: 14px 16px; outline: none;
    background: var(--fill); color: var(--ink); min-width: 0; transition: box-shadow 0.2s ease, border-color 0.2s ease;
  }
  .amount-input:focus { border-color: var(--privacy); box-shadow: 0 0 0 4px var(--privacy-soft); }
  .receive-box {
    flex: 1; font-family: 'Space Grotesk', sans-serif; font-size: 30px; font-weight: 700;
    background: var(--accent-soft); color: var(--accent); border-radius: 12px; padding: 14px 16px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap; position: relative;
  }
  .ccy-select {
    background: var(--fill); border: 1.5px solid var(--line); border-radius: 12px;
    padding: 0 14px; font-size: 15px; font-weight: 600; cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif; color: var(--ink); transition: border-color 0.2s ease;
  }
  .ccy-select:hover { border-color: var(--ink); }
  .swap-divider { text-align: center; color: var(--muted); font-size: 18px; margin: 14px 0; }
  .rate-bar {
    display: flex; justify-content: space-between; align-items: center;
    background: var(--fill); border: 1px solid var(--line); border-radius: 12px;
    padding: 14px 16px; margin: 26px 0 24px; font-family: 'IBM Plex Mono', monospace; font-size: 12.5px;
  }
  .rate-bar .fee { color: var(--accent); font-weight: 600; }
  .rate-bar .shielded { color: var(--privacy); font-weight: 600; display: flex; align-items: center; gap: 5px; }
  .send-btn {
    width: 100%; background: var(--ink); color: #fff; border: none; border-radius: 14px;
    padding: 18px; font-size: 16px; font-weight: 700; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; letter-spacing: 0.01em;
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .send-btn:hover { background: var(--privacy); transform: translateY(-2px); box-shadow: var(--shadow-md); }
  .send-btn:active { transform: translateY(0); }

  /* PROVING STATE */
  .proof-card {
    background: #fff; border: 1px solid var(--line); border-radius: 20px;
    padding: 40px 32px; text-align: left; box-shadow: var(--shadow-lg);
    animation: fadeUp 0.4s cubic-bezier(0.2,0.6,0.2,1);
  }
  .proof-header { display: flex; align-items: center; gap: 12px; margin-bottom: 26px; }
  .proof-spin {
    width: 34px; height: 34px; border-radius: 50%;
    border: 2.5px solid var(--privacy-soft); border-top-color: var(--privacy);
    animation: rotate 0.9s linear infinite; flex-shrink: 0;
  }
  @keyframes rotate { to { transform: rotate(360deg); } }
  .proof-header h2 { font-family: 'Space Grotesk', sans-serif; font-size: 19px; margin: 0; }
  .proof-header p { color: var(--muted); font-size: 12.5px; margin: 2px 0 0; }

  .proof-hex {
    font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: var(--privacy);
    background: var(--privacy-soft); border-radius: 10px; padding: 12px 14px;
    margin-bottom: 22px; word-break: break-word; overflow-wrap: anywhere; line-height: 1.6;
  }

  .proof-steps { display: flex; flex-direction: column; gap: 16px; }
  .proof-step { display: flex; align-items: flex-start; gap: 12px; opacity: 0.35; transition: opacity 0.3s ease; }
  .proof-step.active { opacity: 1; }
  .proof-step.done { opacity: 1; }
  .step-mark {
    width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; margin-top: 1px;
    display: flex; align-items: center; justify-content: center;
    border: 1.5px solid var(--line); font-size: 12px; font-weight: 700;
    transition: all 0.25s ease; color: transparent;
  }
  .proof-step.active .step-mark {
    border-color: var(--privacy); box-shadow: 0 0 0 4px var(--privacy-soft);
  }
  .proof-step.active .step-mark::after {
    content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--privacy);
    animation: pulse 1s ease-in-out infinite;
  }
  .proof-step.done .step-mark {
    background: var(--privacy); border-color: var(--privacy); color: #fff;
  }
  .step-text .step-label { font-weight: 600; font-size: 14px; }
  .step-text .step-sub { color: var(--muted); font-size: 12px; margin-top: 1px; font-family: 'IBM Plex Mono', monospace; }

  .success-card {
    background: #fff; border: 1px solid var(--line); border-radius: 20px;
    padding: 44px 32px; text-align: center; box-shadow: var(--shadow-lg);
    animation: fadeUp 0.5s cubic-bezier(0.2,0.6,0.2,1);
  }
  .success-mark {
    width: 56px; height: 56px; border-radius: 50%; background: var(--accent-soft);
    color: var(--accent); display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 26px; font-weight: 700;
    animation: pop 0.5s cubic-bezier(0.34,1.56,0.64,1);
  }
  @keyframes pop { 0% { transform: scale(0.5); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
  .success-card h2 { font-family: 'Space Grotesk', sans-serif; font-size: 26px; margin: 0 0 8px; }
  .success-card p { color: var(--muted); margin: 0 0 18px; font-size: 15px; }
  .zk-verified-badge {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--privacy-soft); color: var(--privacy); border-radius: 100px;
    padding: 6px 14px; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;
    font-weight: 600; margin-bottom: 22px;
  }
  .audit-table {
    width: 100%; border-collapse: collapse; margin-bottom: 22px;
    background: var(--fill); border: 1px solid var(--line); border-radius: 12px;
    overflow: hidden; text-align: left;
  }
  .audit-table th, .audit-table td {
    padding: 12px 16px; border-bottom: 1px solid var(--line); font-family: 'IBM Plex Mono', monospace;
  }
  .audit-table tr:last-child th, .audit-table tr:last-child td {
    border-bottom: none;
  }
  .audit-table th {
    font-size: 10.5px; color: var(--ink); font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.08em; width: 35%;
    vertical-align: middle;
  }
  .audit-table td {
    font-size: 12px; color: var(--muted); vertical-align: middle;
  }
  .audit-val {
    display: flex; align-items: center; justify-content: space-between; gap: 8px;
  }
  .hex-wrap {
    word-break: break-word; overflow-wrap: anywhere;
  }
  .copy-btn {
    background: transparent; border: none; color: var(--muted);
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    width: 44px; height: 44px; flex-shrink: 0;
    transition: color 0.2s ease, background 0.2s ease; border-radius: 8px;
  }
  .copy-btn:hover { color: var(--ink); background: var(--line); }
  .copy-btn:active { transform: scale(0.95); }

  @media (max-width: 600px) {
    .hero h1 { font-size: 38px; }
    .stats-row { flex-wrap: wrap; row-gap: 14px; }
    .stat { border-right: none; padding: 0 14px; }
    .trust-strip { gap: 16px; }
    
    .audit-table, .audit-table tbody, .audit-table tr, .audit-table th, .audit-table td {
      display: block; width: 100%;
    }
    .audit-table tr { border-bottom: 1px solid var(--line); }
    .audit-table tr:last-child { border-bottom: none; }
    .audit-table th { border-bottom: none; padding-bottom: 2px; padding-top: 16px; }
    .audit-table td { padding-top: 4px; padding-bottom: 16px; border-bottom: none; }
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

function EyeOffIcon({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M3 3l18 18M10.6 10.6a2.5 2.5 0 003.5 3.5M6.5 6.7C4.4 8.1 2.9 10 2 12c1.6 3.6 5.5 7 10 7 1.7 0 3.3-.4 4.7-1.1M9.9 4.2A10.6 10.6 0 0112 4c4.5 0 8.4 3.4 10 7-.5 1.2-1.3 2.5-2.3 3.6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function BoltIcon({ size = 12, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function CopyIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="9" y="9" width="11" height="11" rx="2" stroke={color} strokeWidth="1.6" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Home() {
  const [isClient, setIsClient] = useState(false)
  const [sendAmt, setSendAmt] = useState('100')
  const [fromCcy, setFromCcy] = useState('USD')
  const [toCcy, setToCcy] = useState('NGN')
  const [status, setStatus] = useState<'idle' | 'proving' | 'sent'>('idle')
  const [proofStepIdx, setProofStepIdx] = useState(-1)
  const [proofHex, setProofHex] = useState('')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Set isClient to true after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  const receive = (parseFloat(sendAmt || '0') * rates[toCcy] / rates[fromCcy]).toFixed(2)
  const nodeById = (id: string) => nodes.find(n => n.id === id)!

  // Initialize proofHex only on the client
  useEffect(() => {
    if (isClient && !proofHex) {
      setProofHex(randomHex(48))
    }
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

  const handleSend = () => setStatus('proving')
  const reset = () => {
    setStatus('idle')
    setProofHex('')
  }

  // Generate a stable hex string for the SVG packets (only on client)
  const getPacketHex = (seed: number) => {
    if (!isClient) return '0000'
    return randomHex(4)
  }

  return (
    <div className="page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <Navbar />

      <div className="blob blob-1" />
      <div className="blob blob-2" />

      <div className="hero">
        <div className="eyebrow-row">
          <div className="eyebrow fade-up" style={{ animationDelay: '0.05s' }}><span className="dot-live" /> Live stablecoin rates</div>
          <div className="eyebrow zk fade-up" style={{ animationDelay: '0.1s' }}><span className="dot-live" /> Zero-knowledge private transfers</div>
        </div>
        <h1 className="fade-up" style={{ animationDelay: '0.15s' }}>Convert your stables.<br /><span>Anywhere in the world.</span> <span className="zk-word">Privately.</span></h1>
        <p className="sub fade-up" style={{ animationDelay: '0.25s' }}>
          Move value between currencies on the Stellar network. Every transfer is proven
          with a zero-knowledge proof — amounts and balances stay encrypted, only validity
          is revealed. No banks, no borders, no exposure.
        </p>
        <div className="stats-row fade-up" style={{ animationDelay: '0.35s' }}>
          <div className="stat"><div className="stat-num mono">~5s</div><div className="stat-label">Settlement</div></div>
          <div className="stat"><div className="stat-num mono">$0.001</div><div className="stat-label">Network fee</div></div>
          <div className="stat"><div className="stat-num mono">zk-SNARK</div><div className="stat-label">Proof system</div></div>
          <div className="stat"><div className="stat-num mono">7</div><div className="stat-label">Currencies</div></div>
        </div>

        <div className="trust-strip fade-up" style={{ animationDelay: '0.4s' }}>
          <div className="trust-item"><LockIcon color="var(--privacy)" /> End-to-end encrypted</div>
          <div className="trust-item"><ShieldIcon color="var(--privacy)" /> Zero-knowledge proofs</div>
          <div className="trust-item"><EyeOffIcon color="var(--privacy)" /> Amounts never revealed</div>
          <div className="trust-item"><BoltIcon color="var(--privacy)" /> Non-custodial</div>
        </div>
      </div>

      <div className="network-wrap fade-up" style={{ animationDelay: '0.5s' }}>
        <div
          className="globe-halftone"
          style={{
            left: `${((GLOBE_CX - GLOBE_R) / 640) * 100}%`,
            top: 0,
            width: `${((GLOBE_R * 2) / 640) * 100}%`,
            aspectRatio: '1 / 1',
          }}
        />
        <svg viewBox="0 0 640 400" style={{ width: '100%', position: 'relative' }}>
          <defs>
            <radialGradient id="globeGlow" cx="45%" cy="35%" r="70%">
              <stop offset="0%" stopColor="var(--accent-soft)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--accent-soft)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* orbit rings */}
          <ellipse className="orbit-ring" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R + 22} ry={GLOBE_R + 8} />
          <ellipse className="orbit-ring privacy-ring" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R + 34} ry={GLOBE_R + 18} />

          {/* sphere base + glow */}
          <g className="globe-glow"><circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} /></g>
          <circle className="globe-sphere" cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} />

          {/* latitude lines (static) */}
          <ellipse className="globe-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R} ry={GLOBE_R * 0.62} />
          <ellipse className="globe-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R} ry={GLOBE_R * 0.28} />
          <line className="globe-grid" x1={GLOBE_CX - GLOBE_R} y1={GLOBE_CY} x2={GLOBE_CX + GLOBE_R} y2={GLOBE_CY} />

          {/* longitude lines (rotating) */}
          <g className="globe-rotate">
            <ellipse className="globe-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R * 0.62} ry={GLOBE_R} />
            <ellipse className="globe-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R * 0.28} ry={GLOBE_R} />
            <line className="globe-grid" x1={GLOBE_CX} y1={GLOBE_CY - GLOBE_R} x2={GLOBE_CX} y2={GLOBE_CY + GLOBE_R} />
          </g>

          {/* trade routes + encrypted packets travelling along them */}
          {edges.map(([a, b], i) => {
            const A = nodeById(a), B = nodeById(b)
            const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 - 34
            const path = `M${A.x},${A.y} Q${mx},${my} ${B.x},${B.y}`
            const pathId = `route-${a}-${b}`
            return (
              <g key={i}>
                <path id={pathId} d={path} className="network-edge" />
                <path d={path} className="network-pulse" style={{ animationDelay: `${i * 0.4}s` }} />
                <text className="cipher-packet" style={{ animation: `cipherTravel 3.2s linear infinite`, animationDelay: `${i * 0.4}s`, offsetPath: `path('${path}')` }}>
                  {isClient ? randomHex(4) : '0000'}
                </text>
              </g>
            )
          })}

          {/* currency hubs, each with a shielded ping ring */}
          {nodes.map(n => (
            <g key={n.id} className={`network-node${n.id === 'NGN' ? ' hub' : ''}`} transform={`translate(${n.x},${n.y})`}>
              <circle className="node-shield-ring" r={n.r + 6} />
              <circle r={n.r} />
              <text textAnchor="middle" dy="-4" className="flag">{flags[n.id]}</text>
              <text textAnchor="middle" dy="14" className="code">{n.id}</text>
              <g className="node-shield" transform={`translate(${n.r - 9}, ${-n.r + 3})`}>
                <circle r="7" fill="var(--privacy)" />
                <g transform="translate(-3.5,-3.5) scale(0.7)"><ShieldIcon size={10} color="#fff" /></g>
              </g>
            </g>
          ))}

          {/* center privacy badge */}
          <g className="globe-center-badge" transform={`translate(${GLOBE_CX},${GLOBE_CY})`}>
            <circle className="badge-pulse" r="34" />
            <circle className="badge-ring" r="24" />
            <g transform="translate(-9,-9)"><ShieldIcon size={18} color="var(--privacy)" /></g>
          </g>
        </svg>
      </div>

      <div className="card-wrap fade-up" style={{ animationDelay: '0.6s' }}>
        {status === 'idle' && (
          <div className="card">
            <div className="card-privacy-tag"><ShieldIcon size={11} color="#fff" /> ZK-shielded</div>

            <div className="field-label">You send</div>
            <div className="field-row">
              <input
                type="number"
                value={sendAmt}
                onChange={e => setSendAmt(e.target.value)}
                className="amount-input"
              />
              <select value={fromCcy} onChange={e => setFromCcy(e.target.value)} className="ccy-select">
                {ccyList.map(c => <option key={c} value={c}>{flags[c]} {c}</option>)}
              </select>
            </div>

            <div className="swap-divider">⇅</div>

            <div className="field-label">They receive</div>
            <div className="field-row">
              <div className="receive-box mono">{receive}</div>
              <select value={toCcy} onChange={e => setToCcy(e.target.value)} className="ccy-select">
                {ccyList.map(c => <option key={c} value={c}>{flags[c]} {c}</option>)}
              </select>
            </div>

            <div className="rate-bar">
              <span style={{ color: 'var(--muted)' }}>1 {fromCcy} = {(rates[toCcy] / rates[fromCcy]).toFixed(4)} {toCcy}</span>
              <span className="shielded"><LockIcon size={11} color="var(--privacy)" /> Amount hidden on-chain</span>
            </div>

            <button onClick={handleSend} className="send-btn">
              <ShieldIcon size={15} color="#fff" /> Send {sendAmt || '0'} {fromCcy} →
            </button>
          </div>
        )}

        {status === 'proving' && (
          <div className="proof-card">
            <div className="proof-header">
              <div className="proof-spin" />
              <div>
                <h2 className="display">Generating your proof</h2>
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

        {status === 'sent' && (
          <div className="success-card">
            <div className="success-mark">✓</div>
            <h2 className="display">Sent</h2>
            <p>{receive} {toCcy} is on its way · Arrives in ~5 seconds</p>
            <div className="zk-verified-badge"><ShieldIcon size={12} color="var(--privacy)" /> zk-SNARK proof verified</div>
            <table className="audit-table">
              <tbody>
                <tr>
                  <th>Transaction</th>
                  <td>
                    <div className="audit-val">
                      <span className="hex-wrap">stellar.expert/tx/a3f...9bc</span>
                      <button className="copy-btn" aria-label="Copy transaction link"><CopyIcon size={16} /></button>
                    </div>
                  </td>
                </tr>
                <tr>
                  <th>Preimage</th>
                  <td>
                    <div className="audit-val">
                      <span className="hex-wrap">0x{proofHex}</span>
                      <button className="copy-btn" aria-label="Copy preimage hex"><CopyIcon size={16} /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <button onClick={reset} className="btn-secondary">Send another</button>
          </div>
        )}
      </div>
    </div>
  )
}