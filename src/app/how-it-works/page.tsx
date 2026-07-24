'use client'
import Navbar from '../../../components/Navbar'
import { useState } from 'react'

const STEPS = [
  { num: '1', title: 'Connect wallet', desc: 'Link your non-custodial wallet to begin.' },
  { num: '2', title: 'Set amount', desc: 'Choose the amount and currency to send.' },
  { num: '3', title: 'Proof generated', desc: 'A zero-knowledge proof is generated locally to shield your data.' },
  { num: '4', title: 'Verified on-chain', desc: 'The proof is verified by the network smart contracts.' },
  { num: '5', title: 'Settled', desc: 'Funds are settled instantly to the receiver.' },
]

const FAQS = [
  { q: 'What does the proof hide?', a: 'It hides the sender, receiver, and transfer amount from the public ledger, while still proving the transaction is valid.' },
  { q: 'Who has custody of my funds?', a: 'You maintain full custody at all times. We never hold your keys or balances.' },
  { q: 'Why Stellar?', a: 'Stellar provides the speed and low cost needed for everyday payments, while our ZK layer adds the necessary privacy.' },
]

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
    --shadow-sm: 0 2px 10px rgba(10,10,10,0.05);
  }
  * { box-sizing: border-box; }
  .hiw-page { min-height: 100vh; background: var(--paper); color: var(--ink); font-family: 'IBM Plex Sans', sans-serif; }
  .display { font-family: 'Space Grotesk', sans-serif; }
  .mono { font-family: 'IBM Plex Mono', monospace; }
  
  .hiw-hero { max-width: 680px; margin: 0 auto; padding: 80px 24px 40px; text-align: center; }
  .hiw-hero h1 { font-family: 'Space Grotesk', sans-serif; font-size: 42px; font-weight: 700; margin-bottom: 16px; }
  .hiw-hero p { color: var(--muted); font-size: 18px; line-height: 1.6; }

  .hiw-pipeline { max-width: 800px; margin: 0 auto 60px; padding: 40px 24px; background: var(--privacy-soft); border-radius: 16px; text-align: center; }
  .hiw-pipeline h2 { font-family: 'Space Grotesk', sans-serif; font-size: 24px; margin-bottom: 24px; color: var(--privacy); }
  .hiw-pipeline-flow { display: flex; align-items: center; justify-content: center; gap: 16px; flex-wrap: wrap; }
  .hiw-pipeline-node { background: var(--paper); padding: 16px 24px; border-radius: 8px; font-weight: 600; box-shadow: var(--shadow-sm); }
  .hiw-pipeline-arrow { color: var(--privacy); font-weight: bold; }

  .hiw-steps { max-width: 600px; margin: 0 auto 80px; padding: 0 24px; }
  .hiw-step { display: flex; gap: 24px; margin-bottom: 32px; }
  .hiw-step-num { flex-shrink: 0; width: 40px; height: 40px; background: var(--accent); color: var(--paper); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 700; font-family: 'Space Grotesk', sans-serif; }
  .hiw-step-content h3 { margin: 0 0 8px; font-family: 'Space Grotesk', sans-serif; font-size: 20px; }
  .hiw-step-content p { margin: 0; color: var(--muted); line-height: 1.5; }

  .hiw-faq { max-width: 600px; margin: 0 auto 80px; padding: 0 24px; }
  .hiw-faq h2 { font-family: 'Space Grotesk', sans-serif; font-size: 32px; margin-bottom: 32px; text-align: center; }
  .hiw-faq-item { border-bottom: 1px solid var(--line); padding: 20px 0; cursor: pointer; }
  .hiw-faq-item:first-of-type { border-top: 1px solid var(--line); }
  .hiw-faq-q { font-weight: 600; font-size: 18px; display: flex; justify-content: space-between; align-items: center; }
  .hiw-faq-a { margin-top: 12px; color: var(--muted); line-height: 1.6; display: none; }
  .hiw-faq-a.open { display: block; }
  .hiw-faq-icon { color: var(--accent); font-weight: bold; font-family: 'IBM Plex Mono', monospace; }
`

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="hiw-faq-item" onClick={() => setOpen(!open)}>
      <div className="hiw-faq-q">
        {q}
        <span className="hiw-faq-icon">{open ? '-' : '+'}</span>
      </div>
      <div className={`hiw-faq-a ${open ? 'open' : ''}`}>{a}</div>
    </div>
  )
}

export default function HowItWorks() {
  return (
    <div className="hiw-page">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />
      
      <div className="hiw-hero fade-up">
        <h1>How it Works</h1>
        <p>A transparent look at our privacy-preserving transfer process.</p>
      </div>

      <div className="hiw-pipeline fade-up" style={{ animationDelay: '0.1s' }}>
        <h2>Zero-Knowledge Proof Flow</h2>
        <div className="hiw-pipeline-flow">
          <div className="hiw-pipeline-node">Tx Data</div>
          <div className="hiw-pipeline-arrow">→</div>
          <div className="hiw-pipeline-node" style={{ borderColor: 'var(--privacy)', borderWidth: '2px', borderStyle: 'solid' }}>ZK Prover</div>
          <div className="hiw-pipeline-arrow">→</div>
          <div className="hiw-pipeline-node">ZK Proof</div>
          <div className="hiw-pipeline-arrow">→</div>
          <div className="hiw-pipeline-node">Stellar Network</div>
        </div>
      </div>

      <div className="hiw-steps fade-up" style={{ animationDelay: '0.2s' }}>
        {STEPS.map(step => (
          <div key={step.num} className="hiw-step">
            <div className="hiw-step-num">{step.num}</div>
            <div className="hiw-step-content">
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="hiw-faq fade-up" style={{ animationDelay: '0.3s' }}>
        <h2>Frequently Asked Questions</h2>
        {FAQS.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  )
}
