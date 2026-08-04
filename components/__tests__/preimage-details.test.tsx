import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { computePreimageDetails, offlineVerificationCommands } from '../../src/lib/preimage'
import PreimageDetails from '../PreimageDetails'

vi.mock('../../src/lib/preimage', () => ({
  computePreimageDetails: vi.fn(),
  offlineVerificationCommands: vi.fn(),
}))

const ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

const RESULT = {
  identityBytes: new Uint8Array(32),
  queueIdBytes: new Uint8Array([0x71]),
  timestampBytes: new Uint8Array(8),
  preimage: new Uint8Array(41),
  unixSeconds: 1700000000,
  identityHex: 'aa'.repeat(32),
  queueIdHex: '71',
  timestampHex: '0000000065597540',
  preimageHex: 'aa'.repeat(32) + '71' + '0000000065597540',
  computedHash: 'f'.repeat(64),
  matches: true,
}

describe('PreimageDetails', () => {
  beforeEach(() => {
    vi.mocked(computePreimageDetails).mockResolvedValue(RESULT as never)
    vi.mocked(offlineVerificationCommands).mockReturnValue({
      shasum: 'shasum cmd',
      openssl: 'openssl cmd',
      python: 'python cmd',
    } as never)
  })

  it('is collapsed by default and expands on click', async () => {
    const user = userEvent.setup()
    render(<PreimageDetails address={ADDRESS} queueId="q" timestamp="1700000000" defaultOpen={false} />)

    const toggle = screen.getByRole('button', { name: /preimage details/i })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText(/Step 1/i)).not.toBeInTheDocument()

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(await screen.findByText(/Step 1 — Preimage components/i)).toBeInTheDocument()
  })

  it('collapses again when the toggle is clicked a second time', async () => {
    const user = userEvent.setup()
    render(<PreimageDetails address={ADDRESS} queueId="q" timestamp="1700000000" />)

    await user.click(screen.getByRole('button', { name: /preimage details/i }))
    await screen.findByText(/Step 1/i)
    await user.click(screen.getByRole('button', { name: /preimage details/i }))

    expect(screen.queryByText(/Step 1/i)).not.toBeInTheDocument()
  })

  it('matches verdict when the recomputed hash reproduces the recorded hash', async () => {
    render(<PreimageDetails address={ADDRESS} queueId="q" timestamp="1700000000" recordedHash={'f'.repeat(64)} />)
    await userEvent.click(screen.getByRole('button', { name: /preimage details/i }))

    expect(await screen.findByText('Reproduces hash')).toBeInTheDocument()
  })

  it('copies a field value to the clipboard', async () => {
    const user = userEvent.setup()
    render(<PreimageDetails address={ADDRESS} queueId="q" timestamp="1700000000" />)
    await user.click(screen.getByRole('button', { name: /preimage details/i }))

    await user.click(await screen.findByRole('button', { name: 'Copy computed_hash' }))

    expect(await screen.findByRole('button', { name: 'computed_hash copied' })).toBeInTheDocument()
  })

  it('shows an error when preimage derivation fails', async () => {
    vi.mocked(computePreimageDetails).mockRejectedValueOnce(new Error('INVALID_ADDRESS'))
    render(<PreimageDetails address="bad" queueId="q" timestamp="1700000000" />)
    await userEvent.click(screen.getByRole('button', { name: /preimage details/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent('INVALID_ADDRESS')
  })
})