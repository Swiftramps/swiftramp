import test from 'node:test'
import assert from 'node:assert/strict'
import { fetchRates, resetRateCache, subscribeToRates, SUPPORTED_CURRENCIES } from '../src/lib/rates.ts'

const liveRates = { USD: 1, EUR: .91, GBP: .78, NGN: 1600, KES: 131, GHS: 15.4, ZAR: 18.2 }
const response = rates => Promise.resolve({ ok: true, json: async () => ({ result: 'success', rates }) })

test('fetchRates returns the expected currency structure', async () => {
  resetRateCache()
  const result = await fetchRates({ now: () => 1000, fetcher: () => response(liveRates) })
  assert.deepEqual(Object.keys(result.rates).sort(), [...SUPPORTED_CURRENCIES].sort())
  assert.deepEqual(result.rates, liveRates)
  assert.equal(result.source, 'live')
})

test('cache is reused within TTL and revalidated after TTL', async () => {
  resetRateCache()
  let now = 1000
  let calls = 0
  const fetcher = () => { calls += 1; return response({ ...liveRates, NGN: 1600 + calls }) }
  await fetchRates({ ttlMs: 100, now: () => now, fetcher })
  now = 1050
  assert.equal((await fetchRates({ ttlMs: 100, now: () => now, fetcher })).rates.NGN, 1601)
  assert.equal(calls, 1)
  now = 1200
  const updated = new Promise(resolve => {
    const unsubscribe = subscribeToRates(value => {
      if (value.source === 'live' && value.rates.NGN === 1602) { unsubscribe(); resolve(value) }
    })
  })
  const staleWhileRevalidating = await fetchRates({ ttlMs: 100, now: () => now, fetcher })
  assert.equal(staleWhileRevalidating.rates.NGN, 1601)
  await updated
  assert.equal(calls, 2)
})

test('network failure falls back to the last-known-good rates', async () => {
  resetRateCache()
  let now = 1000
  await fetchRates({ ttlMs: 100, now: () => now, fetcher: () => response(liveRates) })
  now = 1200
  const fallback = new Promise(resolve => {
    const unsubscribe = subscribeToRates(value => {
      if (value.source === 'cache') { unsubscribe(); resolve(value) }
    })
  })
  await fetchRates({ ttlMs: 100, now: () => now, fetcher: async () => { throw new Error('offline') } })
  const result = await fallback
  assert.deepEqual(result.rates, liveRates)
  assert.equal(result.source, 'cache')
})
