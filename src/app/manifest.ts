import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SwiftRamp – Cross-Border Remittance',
    short_name: 'SwiftRamp',
    description: 'Fast, cheap cross-border payments on Stellar',
    start_url: '/',
    display: 'standalone',
    background_color: '#FFFFFF',
    theme_color: '#17462B',
    icons: [
      { src: '/images/logo.png', sizes: 'any', type: 'image/png' },
    ],
  }
}
