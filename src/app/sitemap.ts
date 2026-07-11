import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://swiftramp.com'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/swap`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/rates`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/get-started`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/company`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]
}
