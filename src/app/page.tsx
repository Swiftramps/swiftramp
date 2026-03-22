'use client'
import { useState } from 'react'

const rates: Record<string, number> = { NGN: 1580, KES: 130, GHS: 15.6, ZAR: 18.9, USD: 1, EUR: 0.93 }
const flags: Record<string, string> = { NGN: '🇳🇬', KES: '🇰🇪', GHS: '🇬🇭', ZAR: '🇿🇦', USD: '🇺🇸', EUR: '🇪🇺' }

export default function Home() {
  const [sendAmt, setSendAmt] = useState('100')
  const [fromCcy, setFromCcy] = useState('USD')
  const [toCcy, setToCcy] = useState('NGN')
  const [sent, setSent] = useState(false)

  const receive = (parseFloat(sendAmt) * rates[toCcy] / rates[fromCcy]).toFixed(2)

  return (
    <div style={{ minHeight: '100vh', background: '#f0f7ff' }}>
      <nav style={{ background: '#fff', borderBottom: '1px solid #e2eaf5', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#1e40af' }}>Swift<span style={{ color: '#f59e0b' }}>Star</span></div>
        <div style={{ fontSize: 13, color: '#64748b' }}>Powered by Stellar Path Payments</div>
        <button style={{ background: '#1e40af', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Connect</button>
      </nav>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '60px 24px' }}>
        <h1 style={{ fontSize: 42, fontWeight: 900, textAlign: 'center', marginBottom: 8, color: '#0a1628', lineHeight: 1.1 }}>Send money<br /><span style={{ color: '#1e40af' }}>across borders.</span></h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: 40, fontSize: 15 }}>Stellar settles in 5 seconds. Fees under $0.01.</p>

        {!sent ? (
          <div style={{ background: '#fff', borderRadius: 24, padding: 32, boxShadow: '0 4px 40px rgba(30,64,175,0.08)' }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>YOU SEND</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <input type="number" value={sendAmt} onChange={e => setSendAmt(e.target.value)} style={{ flex: 1, fontSize: 28, fontWeight: 800, border: '2px solid #e2eaf5', borderRadius: 12, padding: '14px 16px', outline: 'none', fontFamily: 'inherit', color: '#0a1628' }} />
                <select value={fromCcy} onChange={e => setFromCcy(e.target.value)} style={{ background: '#f0f7ff', border: '2px solid #e2eaf5', borderRadius: 12, padding: '0 16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {Object.keys(rates).map(c => <option key={c} value={c}>{flags[c]} {c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: 20, margin: '10px 0' }}>⇅</div>

            <div style={{ marginBottom: 28 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: 1 }}>THEY RECEIVE</label>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                <div style={{ flex: 1, fontSize: 28, fontWeight: 800, background: '#f0f7ff', borderRadius: 12, padding: '14px 16px', color: '#1e40af' }}>{receive}</div>
                <select value={toCcy} onChange={e => setToCcy(e.target.value)} style={{ background: '#f0f7ff', border: '2px solid #e2eaf5', borderRadius: 12, padding: '0 16px', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  {Object.keys(rates).map(c => <option key={c} value={c}>{flags[c]} {c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ background: '#f0f7ff', borderRadius: 12, padding: '14px 18px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>Rate: 1 {fromCcy} = {(rates[toCcy]/rates[fromCcy]).toFixed(4)} {toCcy}</span>
              <span style={{ color: '#10b981', fontWeight: 700 }}>Fee: ~$0.001</span>
            </div>

            <button onClick={() => setSent(true)} style={{ width: '100%', background: '#1e40af', border: 'none', borderRadius: 14, padding: '18px', fontSize: 17, fontWeight: 800, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
              Send {sendAmt} {fromCcy} →
            </button>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 24, padding: 40, textAlign: 'center', boxShadow: '0 4px 40px rgba(30,64,175,0.08)' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Sent!</h2>
            <p style={{ color: '#64748b', marginBottom: 20 }}>{receive} {toCcy} is on its way · Arrives in ~5 seconds</p>
            <div style={{ background: '#f0f7ff', borderRadius: 12, padding: 16, fontFamily: 'monospace', fontSize: 12, color: '#1e40af', marginBottom: 24 }}>TX: stellar.expert/tx/a3f...9bc</div>
            <button onClick={() => setSent(false)} style={{ background: '#f0f7ff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: '#1e40af' }}>Send another</button>
          </div>
        )}
      </div>
    </div>
  )
}
