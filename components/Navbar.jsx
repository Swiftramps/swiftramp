'use client'
import { useState, useEffect } from 'react'
import Image from 'next/image'

const CSS = `
  /* Add padding to the body to prevent content from hiding behind the fixed navbar */
  body {
    padding-top: 82px;
    margin: 0;
  }
  
  .navbar {
    display: flex; 
    align-items: center; 
    justify-content: space-between;
    padding: 18px 48px; 
    border-bottom: 1px solid var(--line, #EAEAE6);
    background: #fff;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    width: 100%;
    box-sizing: border-box;
    transition: box-shadow 0.3s ease;
  }
  
  .navbar.scrolled {
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
  }
  
  .navbar-brand {
    display: flex; 
    align-items: center; 
    gap: 10px;
    text-decoration: none; 
    color: inherit;
  }
  
  .navbar-logo-img { 
    display: block; 
    height: 28px; 
    width: auto; 
  }
  
  .navbar-wordmark {
    font-family: 'Space Grotesk', sans-serif; 
    font-weight: 700; 
    font-size: 20px;
    letter-spacing: 0.02em; 
    text-transform: uppercase; 
    color: var(--ink, #0A0A0A);
  }
  
  .navbar-wordmark span { 
    color: var(--accent, #17462B); 
  }

  .navbar-badge {
    display: inline-flex; 
    align-items: center; 
    gap: 5px;
    font-family: 'IBM Plex Mono', monospace; 
    font-size: 10.5px; 
    font-weight: 600;
    letter-spacing: 0.06em; 
    text-transform: uppercase;
    color: var(--privacy, #5B3DF5); 
    background: var(--privacy-soft, #ECE8FE);
    border-radius: 100px; 
    padding: 4px 10px; 
    margin-left: 4px;
  }

  .navbar-center { 
    display: flex; 
    align-items: center; 
    gap: 14px; 
  }

  .navbar-links { 
    display: flex; 
    align-items: center; 
    gap: 32px; 
  }
  
  .navbar-links a {
    color: var(--muted, #6B6960); 
    text-decoration: none; 
    font-size: 14px; 
    font-weight: 500;
    position: relative; 
    padding-bottom: 3px; 
    transition: color 0.2s ease;
  }
  
  .navbar-links a::after {
    content: ''; 
    position: absolute; 
    left: 0; 
    right: 100%; 
    bottom: 0; 
    height: 1.5px;
    background: var(--privacy, #5B3DF5); 
    transition: right 0.25s ease;
  }
  
  .navbar-links a:hover { 
    color: var(--ink, #0A0A0A); 
  }
  
  .navbar-links a:hover::after { 
    right: 0; 
  }

  .navbar-right { 
    display: flex; 
    align-items: center; 
    gap: 18px; 
  }

  .navbar-cta {
    background: var(--ink, #0A0A0A); 
    color: #fff; 
    border: none; 
    border-radius: 100px;
    padding: 12px 24px; 
    font-weight: 600; 
    font-size: 14px; 
    cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif; 
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  }
  
  .navbar-cta:hover { 
    background: var(--privacy, #5B3DF5); 
    transform: translateY(-2px); 
    box-shadow: var(--shadow-md, 0 12px 40px rgba(10,10,10,0.07)); 
  }

  .navbar-burger {
    display: none; 
    flex-direction: column; 
    justify-content: center; 
    gap: 5px;
    width: 40px; 
    height: 40px; 
    border: 1.5px solid var(--line, #EAEAE6); 
    border-radius: 10px;
    background: #fff; 
    cursor: pointer; 
    padding: 0;
  }
  
  .navbar-burger span {
    display: block; 
    height: 1.6px; 
    width: 18px; 
    margin: 0 auto;
    background: var(--ink, #0A0A0A); 
    border-radius: 2px;
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
  
  .navbar-burger.open span:nth-child(1) { 
    transform: translateY(6.5px) rotate(45deg); 
  }
  
  .navbar-burger.open span:nth-child(2) { 
    opacity: 0; 
  }
  
  .navbar-burger.open span:nth-child(3) { 
    transform: translateY(-6.5px) rotate(-45deg); 
  }

  .navbar-mobile-panel {
    display: none;
    flex-direction: column;
    position: fixed;
    top: 82px;
    left: 0;
    right: 0;
    background: #fff; 
    border-bottom: 1px solid var(--line, #EAEAE6);
    padding: 0 24px 0;
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    z-index: 999;
    transition: max-height 0.25s ease, opacity 0.2s ease, padding 0.25s ease;
    box-sizing: border-box;
  }
  
  .navbar-mobile-panel.open {
    max-height: 400px;
    opacity: 1;
    padding: 12px 24px 20px;
  }
  
  .navbar-mobile-panel a {
    color: var(--ink, #0A0A0A); 
    text-decoration: none; 
    font-size: 16px; 
    font-weight: 600;
    padding: 14px 4px; 
    border-bottom: 1px solid var(--line, #EAEAE6);
  }
  
  .navbar-mobile-panel a:last-of-type { 
    border-bottom: none; 
  }
  
  .navbar-mobile-cta {
    margin-top: 16px; 
    width: 100%; 
    background: var(--ink, #0A0A0A); 
    color: #fff; 
    border: none;
    border-radius: 100px; 
    padding: 14px; 
    font-weight: 600; 
    font-size: 15px; 
    cursor: pointer;
    font-family: 'IBM Plex Sans', sans-serif;
    display: block;
    text-align: center;
    text-decoration: none;
    box-sizing: border-box;
  }

  @media (max-width: 760px) {
    .navbar { 
      padding: 14px 20px; 
    }
    
    .navbar-links { 
      display: none; 
    }
    
    .navbar-cta { 
      display: none; 
    }
    
    .navbar-badge { 
      display: none; 
    }
    
    .navbar-burger { 
      display: flex; 
    }
    
    .navbar-mobile-panel { 
      display: flex; 
    }
    
    body {
      padding-top: 70px;
    }
    
    .navbar-mobile-panel {
      top: 70px;
    }
  }
`

const LINKS = [
  { label: 'How it works', href: '/how-it-works' },
  { label: 'Rates', href: '/rates' },
  { label: 'Company', href: '/company' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  // Handle scroll effect for shadow
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile panel automatically if the viewport grows back to desktop size
  useEffect(() => {
    const onResize = () => { 
      if (window.innerWidth > 760) setOpen(false) 
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <nav className={`navbar${scrolled ? ' scrolled' : ''}`}>
        <div className="navbar-center">
          <a href="/" className="navbar-brand">
            <Image
              src="/images/logo.png"
              alt="SwiftRamp logo"
              width={100}
              height={100}
              className="navbar-logo-img"
              priority
            />
          </a>
          <span className="navbar-badge">🔒 ZK secured</span>
        </div>

        <div className="navbar-links">
          {LINKS.map(l => <a key={l.label} href={l.href}>{l.label}</a>)}
        </div>

        <div className="navbar-right">
        <a href="/get-started" className="navbar-cta" style={{ textDecoration: 'none' }}>Get started</a>

          <button
            className={`navbar-burger${open ? ' open' : ''}`}
            onClick={() => setOpen(o => !o)}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`navbar-mobile-panel${open ? ' open' : ''}`}>
        {LINKS.map(l => (
          <a key={l.label} href={l.href} onClick={() => setOpen(false)}>{l.label}</a>
        ))}
        <a href="/get-started" className="navbar-mobile-cta" onClick={() => setOpen(false)}>Get started</a>
      </div>
    </>
  )
}