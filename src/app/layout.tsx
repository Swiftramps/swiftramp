import type { Metadata, Viewport } from 'next'
import './globals.css'
export const metadata: Metadata = {
  openGraph: {
    title: 'SwiftRamp – Cross-Border Remittance',
    description: 'Fast, cheap cross-border payments on Stellar',
    siteName: 'SwiftRamp',
    type: 'website',
  }, title: 'SwiftRamp – Cross-Border Remittance', description: 'Fast, cheap cross-border payments on Stellar' }
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#17462B',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" /></head>
      <body style={{ fontFamily: "'Nunito', sans-serif", background: '#f0f7ff', color: '#0a1628', margin: 0 }}>{children}</body>
    </html>
  )
}