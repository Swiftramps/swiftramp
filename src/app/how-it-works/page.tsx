'use client'
import Navbar from '../../../components/Navbar'

import { flags } from '@/lib/constants'

// Same node layout as the homepage globe, reused at company scale to make
// the point concrete: this is the literal footprint the company operates in.
const nodes = [
  { id: 'NGN', x: 150, y: 195, r: 26, label: 'Lagos' },
  { id: 'GHS', x: 98, y: 275, r: 22, label: 'Accra' },
  { id: 'GBP', x: 220, y: 92, r: 23, label: 'London' },
  { id: 'USD', x: 392, y: 68, r: 26, label: 'New York' },
  { id: 'EUR', x: 502, y: 152, r: 23, label: 'Frankfurt' },
  { id: 'KES', x: 430, y: 292, r: 23, label: 'Nairobi' },
  { id: 'ZAR', x: 300, y: 332, r: 22, label: 'Johannesburg' },
]
const edges = [
  ['NGN', 'GBP'], ['NGN', 'USD'], ['GHS', 'NGN'], ['USD', 'EUR'],
  ['EUR', 'KES'], ['KES', 'ZAR'], ['NGN', 'ZAR'], ['GBP', 'EUR'],
]
const GLOBE_CX = 320, GLOBE_CY = 200, GLOBE_R = 210

const PRINCIPLES = [
  {
    title: 'Privacy is the default, not an upgrade',
    body: 'Every transfer is shielded by a zero-knowledge proof from the first version we shipped. We\u2019ve never offered a "private mode" as a paid add-on, because splitting privacy from the base product treats it as optional.',
  },
  {
    title: 'Custody stays with the sender',
    body: 'We don\u2019t hold balances, and we can\u2019t freeze or reverse a transfer once it\u2019s signed. The architecture makes this true structurally, not just contractually.',
  },
  {
    title: 'Cost should track the network, not the market',
    body: 'Our fee is Stellar\u2019s settlement cost, passed through. We don\u2019t add a spread on top of the exchange rate, and we publish the rate board so that\u2019s checkable.',
  },
  {
    title: 'Build for corridors banks underserve',
    body: 'We started with routes between West Africa, East Africa, and the currencies people there actually get paid in and send home \u2014 not the corridors with the thickest existing infrastructure.',
  },
]

const STATS = [
  { num: '7', label: 'Currencies supported' },
  { num: '~5s', label: 'Average settlement' },
  { num: '$0.001', label: 'Network fee' },
  { num: '0', label: 'Custodial wallets held' },
]

function ShieldIcon({ size = 16, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" fill="none" />
      <path d="M9 12l2 2 4-4.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
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
  .co-page { min-height: 100vh; background: var(--paper); color: var(--ink); font-family: 'IBM Plex Sans', sans-serif; position: relative; overflow-x: hidden; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  .display { font-family: 'Space Grotesk', sans-serif; }
  .fade-up { opacity: 0; transform: translateY(16px); animation: fadeUp 0.7s cubic-bezier(0.2,0.6,0.2,1) forwards; }
  @keyframes fadeUp { to { opacity: 1; transform: translateY(0); } }

  .co-blob { position: absolute; border-radius: 50%; filter: blur(70px); z-index: 0; pointer-events: none; }
  .co-blob-1 { width: 400px; height: 400px; background: var(--accent-soft); opacity: 0.5; top: -120px; left: -140px; }
  .co-blob-2 { width: 320px; height: 320px; background: var(--privacy-soft); opacity: 0.55; top: 30px; right: -120px; }

  .co-hero { max-width: 680px; margin: 0 auto; padding: 76px 24px 0; text-align: center; position: relative; z-index: 1; }
  .co-eyebrow {
    display: inline-flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace;
    font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--accent);
    background: var(--accent-soft); padding: 6px 14px; border-radius: 100px; margin-bottom: 22px; box-shadow: var(--shadow-sm);
  }
  .co-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); animation: pulse 1.6s ease-in-out infinite; }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
  .co-hero h1 { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 46px; line-height: 1.1; letter-spacing: -0.01em; margin: 0 0 18px; }
  .co-hero p { color: var(--muted); font-size: 17px; line-height: 1.65; margin: 0 auto; max-width: 540px; }

  .co-stats { display: flex; justify-content: center; gap: 0; margin: 40px auto 0; max-width: 560px; }
  .co-stat { flex: 1; padding: 0 12px; border-right: 1px solid var(--line); }
  .co-stat:last-child { border-right: none; }
  .co-stat-num { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 22px; }
  .co-stat-label { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; margin-top: 3px; }

  /* --- NETWORK MAP (signature element): the homepage globe, repurposed as
     a literal "where we operate" map with named cities instead of abstract
     currency hubs. Same visual language, different job: proof vs. footprint. */
  .map-wrap { position: relative; max-width: 880px; margin: 60px auto 0; padding: 0 24px; z-index: 1; }
  .map-caption { text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px; color: var(--muted); margin-bottom: 8px; letter-spacing: 0.04em; }
  .map-sphere { fill: var(--fill); stroke: var(--ink); stroke-width: 1.4; }
  .map-grid { stroke: var(--line); stroke-width: 1; fill: none; }
  .map-edge { stroke: var(--line); stroke-width: 1.4; fill: none; }
  .map-pulse { stroke: var(--accent); stroke-width: 1.6; fill: none; stroke-dasharray: 5 200; animation: travel 3.5s linear infinite; }
  @keyframes travel { to { stroke-dashoffset: -205; } }
  .map-node circle { fill: #fff; stroke: var(--ink); stroke-width: 1.6; filter: drop-shadow(0 2px 6px rgba(10,10,10,0.1)); }
  .map-node.origin circle { fill: var(--accent-soft); stroke: var(--accent); }
  .map-node .flag { font-size: 13px; }
  .map-node .city {
    font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; font-weight: 600; fill: var(--muted);
  }

  /* --- MISSION STATEMENT --- */
  .mission-wrap { max-width: 720px; margin: 70px auto 0; padding: 0 24px; text-align: center; position: relative; z-index: 1; }
  .mission-wrap p.big {
    font-family: 'Space Grotesk', sans-serif; font-size: 28px; line-height: 1.4; font-weight: 600; margin: 0;
  }
  .mission-wrap p.big span { color: var(--privacy); }

  /* --- PRINCIPLES --- */
  .principles-wrap { max-width: 880px; margin: 76px auto 0; padding: 0 24px; position: relative; z-index: 1; }
  .principles-heading { text-align: center; margin-bottom: 34px; }
  .principles-heading h2 { font-family: 'Space Grotesk', sans-serif; font-size: 28px; margin: 0 0 8px; }
  .principles-heading p { color: var(--muted); font-size: 14.5px; margin: 0; }
  .principles-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
  .principle-card {
    background: #fff; border: 1px solid var(--line); border-radius: 18px; padding: 26px;
    box-shadow: var(--shadow-sm); transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .principle-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); }
  .principle-icon {
    width: 34px; height: 34px; border-radius: 10px; background: var(--accent-soft); color: var(--accent);
    display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
  }
  .principle-title { font-family: 'Space Grotesk', sans-serif; font-weight: 700; font-size: 16px; margin-bottom: 8px; }
  .principle-body { color: var(--muted); font-size: 13.5px; line-height: 1.6; }

  /* --- CTA --- */
  .co-cta-wrap { max-width: 640px; margin: 76px auto 0; padding: 0 24px 110px; text-align: center; position: relative; z-index: 1; }
  .co-cta-card {
    background: var(--ink); border-radius: 22px; padding: 48px 32px; color: #fff;
  }
  .co-cta-card h2 { font-family: 'Space Grotesk', sans-serif; font-size: 26px; margin: 0 0 10px; }
  .co-cta-card p { color: rgba(255,255,255,0.65); font-size: 14.5px; margin: 0 0 26px; }
  .btn-invert {
    display: inline-flex; align-items: center; gap: 8px; background: #fff; color: var(--ink); border: none;
    border-radius: 100px; padding: 14px 28px; font-weight: 700; font-size: 14.5px; cursor: pointer;
    font-family: 'Space Grotesk', sans-serif; text-decoration: none; transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .btn-invert:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(255,255,255,0.15); }

  @media (max-width: 700px) {
    .co-hero h1 { font-size: 32px; }
    .principles-grid { grid-template-columns: 1fr; }
    .mission-wrap p.big { font-size: 21px; }
  }
`

export default function CompanyPage() {
  const nodeById = (id: string) => nodes.find(n => n.id === id)!

  return (
    <div className="co-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />

      <div className="co-blob co-blob-1" />
      <div className="co-blob co-blob-2" />

      <div className="co-hero">
        <div className="co-eyebrow fade-up"><span className="co-dot" /> Founded to close a settlement gap</div>
        <h1 className="fade-up" style={{ animationDelay: '0.05s' }}>Moving money shouldn't cost you your privacy.</h1>
        <p className="fade-up" style={{ animationDelay: '0.1s' }}>
          SwiftRamp builds shielded, non-custodial currency transfers on Stellar for the
          corridors between West Africa, East Africa, and the rest of the world \u2014 routes
          that conventional banking rails still price slowly and expensively.
        </p>
        <div className="co-stats fade-up" style={{ animationDelay: '0.2s' }}>
          {STATS.map(s => (
            <div className="co-stat" key={s.label}>
              <div className="co-stat-num mono">{s.num}</div>
              <div className="co-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="map-wrap fade-up" style={{ animationDelay: '0.3s' }}>
        <div className="map-caption">WHERE SWIFTRAMP OPERATES</div>
        <svg viewBox="0 0 640 400" style={{ width: '100%' }}>
          <circle className="map-sphere" cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} />
          <ellipse className="map-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R} ry={GLOBE_R * 0.62} />
          <ellipse className="map-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R} ry={GLOBE_R * 0.28} />
          <line className="map-grid" x1={GLOBE_CX - GLOBE_R} y1={GLOBE_CY} x2={GLOBE_CX + GLOBE_R} y2={GLOBE_CY} />
          <ellipse className="map-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R * 0.62} ry={GLOBE_R} />
          <ellipse className="map-grid" cx={GLOBE_CX} cy={GLOBE_CY} rx={GLOBE_R * 0.28} ry={GLOBE_R} />
          <line className="map-grid" x1={GLOBE_CX} y1={GLOBE_CY - GLOBE_R} x2={GLOBE_CX} y2={GLOBE_CY + GLOBE_R} />

          {edges.map(([a, b], i) => {
            const A = nodeById(a), B = nodeById(b)
            const mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2 - 30
            const path = `M${A.x},${A.y} Q${mx},${my} ${B.x},${B.y}`
            return (
              <g key={i}>
                <path d={path} className="map-edge" />
                <path d={path} className="map-pulse" style={{ animationDelay: `${i * 0.45}s` }} />
              </g>
            )
          })}

          {nodes.map(n => (
            <g key={n.id} className={`map-node${n.id === 'NGN' ? ' origin' : ''}`} transform={`translate(${n.x},${n.y})`}>
              <circle r={n.r} />
              <text textAnchor="middle" dy="-3" className="flag">{flags[n.id]}</text>
              <text textAnchor="middle" dy={n.r + 14} className="city">{n.label}</text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mission-wrap fade-up" style={{ animationDelay: '0.35s' }}>
        <p className="big">
          We think a transfer between Lagos and London should settle as fast as one
          between two banks in the same city \u2014 <span>without asking either side to give up
          how much they sent.</span>
        </p>
      </div>

      <div className="principles-wrap">
        <div className="principles-heading fade-up">
          <h2 className="display">What we hold ourselves to</h2>
          <p>Four commitments that shape every product decision.</p>
        </div>
        <div className="principles-grid">
          {PRINCIPLES.map((p, i) => (
            <div className="principle-card fade-up" key={p.title} style={{ animationDelay: `${0.05 * i}s` }}>
              <div className="principle-icon"><ShieldIcon size={18} /></div>
              <div className="principle-title">{p.title}</div>
              <div className="principle-body">{p.body}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="co-cta-wrap fade-up">
        <div className="co-cta-card">
          <h2 className="display">See it move, once.</h2>
          <p>Connect a wallet and send a shielded transfer \u2014 the fastest way to understand what we mean.</p>
          <a href="/get-started" className="btn-invert">Get started →</a>
        </div>
      </div>
    </div>
  )
}