import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

Object.defineProperty(globalThis.navigator, 'clipboard', {
  value: { writeText: vi.fn(() => Promise.resolve()) },
  configurable: true,
})
