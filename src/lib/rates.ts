export type Rates = Record<string, number>
export type RateSnapshot = { rates: Rates; updatedAt: number; source: 'live' | 'cache' | 'fallback'; stale: boolean }
export type FetchRatesOptions = { ttlMs?: number; staleAfterMs?: number; now?: () => number; fetcher?: typeof fetch }
export const DEFAULT_RATE_TTL_MS = 60_000
export const DEFAULT_STALE_AFTER_MS = 300_000
export const SUPPORTED_CURRENCIES = ['USD', 'EUR', 'GBP', 'NGN', 'KES', 'GHS', 'ZAR'] as const
export const FALLBACK_RATES: Rates = { USD: 1, EUR: .93, GBP: .79, NGN: 1580, KES: 130, GHS: 15.6, ZAR: 18.9 }
const STORAGE_KEY = 'swiftramp:last-known-fx-rates'
let cache: RateSnapshot | null = null
let pending: Promise<RateSnapshot> | null = null
const listeners = new Set<(value: RateSnapshot) => void>()
function valid(value: unknown): value is Rates {
  const item = value as Rates
  return !!item && SUPPORTED_CURRENCIES.every(code => Number.isFinite(item[code]) && item[code] > 0)
}
function status(value: RateSnapshot, now: number, staleAfter: number, source = value.source): RateSnapshot {
  return { ...value, source, stale: !value.updatedAt || now - value.updatedAt > staleAfter }
}
function stored(now: number, staleAfter: number): RateSnapshot | null {
  if (typeof window === 'undefined') return null
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') as RateSnapshot | null
    return value && valid(value.rates) && typeof value.updatedAt === 'number' ? status(value, now, staleAfter, 'cache') : null
  } catch { return null }
}
function publish(value: RateSnapshot) {
  cache = value
  if (typeof window !== 'undefined' && value.updatedAt) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(value)) } catch {}
  }
  listeners.forEach(listener => listener(value))
}
function refresh(staleAfter: number, now: () => number, fetcher: typeof fetch) {
  if (pending) return pending
  pending = (async () => {
    try {
      const url = process.env.NEXT_PUBLIC_FX_API_URL || 'https://open.er-api.com/v6/latest/USD'
      const response = await fetcher(url, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(String(response.status))
      const body = await response.json() as { rates?: Rates; result?: string }
      if (body.result === 'error' || !valid(body.rates)) throw new Error('Invalid FX response')
      const value: RateSnapshot = { rates: Object.fromEntries(SUPPORTED_CURRENCIES.map(code => [code, body.rates![code]])), updatedAt: now(), source: 'live', stale: false }
      publish(value)
      return value
    } catch {
      const previous = cache || stored(now(), staleAfter)
      const value: RateSnapshot = previous ? status(previous, now(), staleAfter, 'cache') : { rates: FALLBACK_RATES, updatedAt: 0, source: 'fallback', stale: true }
      publish(value)
      return value
    } finally { pending = null }
  })()
  return pending
}
export async function fetchRates(options: FetchRatesOptions = {}): Promise<RateSnapshot> {
  const ttl = options.ttlMs ?? Number(process.env.NEXT_PUBLIC_FX_CACHE_TTL_MS || DEFAULT_RATE_TTL_MS)
  const staleAfter = options.staleAfterMs ?? DEFAULT_STALE_AFTER_MS
  const now = options.now ?? Date.now
  const fetcher = options.fetcher ?? fetch
  const current = cache || stored(now(), staleAfter)
  if (!current) return refresh(staleAfter, now, fetcher)
  cache = current
  const value = status(current, now(), staleAfter, 'cache')
  if (!value.updatedAt || now() - value.updatedAt >= ttl) void refresh(staleAfter, now, fetcher)
  return value
}
export function subscribeToRates(listener: (value: RateSnapshot) => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}
export function resetRateCache() { cache = null; pending = null }
