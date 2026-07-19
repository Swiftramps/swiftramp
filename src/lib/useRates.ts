'use client'
import { useEffect, useState } from 'react'
import { FALLBACK_RATES, fetchRates, subscribeToRates, type RateSnapshot } from './rates'
const initial: RateSnapshot = { rates: FALLBACK_RATES, updatedAt: 0, source: 'fallback', stale: true }
export function useRates() {
  const [snapshot, setSnapshot] = useState(initial)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    const update = (value: RateSnapshot) => { if (active) { setSnapshot(value); setLoading(false) } }
    const unsubscribe = subscribeToRates(update)
    void fetchRates().then(update)
    return () => { active = false; unsubscribe() }
  }, [])
  return { ...snapshot, loading }
}
