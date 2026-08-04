import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuditVerifiedBadge from '../AuditVerifiedBadge'

const PROOF = 'deadbeef'.repeat(8)

function mockVerify(status: 'verified' | 'unverified' | 'unknown', verifiedAt: string | null = null) {
  const fn = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status, proof_hash: PROOF, verified_at: verifiedAt, message: 'ok' }),
    } as Response),
  )
  vi.stubGlobal('fetch', fn)
  return fn
}

describe('AuditVerifiedBadge', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('renders the verified state', async () => {
    mockVerify('verified', '2026-01-01T00:00:00.000Z')
    render(<AuditVerifiedBadge proofHash={PROOF} />)

    expect(await screen.findByText('Enrollment verified')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Re-verify enrollment' })).toBeInTheDocument()
  })

  it('renders the unverified state', async () => {
    mockVerify('unverified')
    render(<AuditVerifiedBadge proofHash={PROOF} />)

    expect(await screen.findByText('Unverified')).toBeInTheDocument()
  })

  it('renders the unknown state', async () => {
    mockVerify('unknown')
    render(<AuditVerifiedBadge proofHash={PROOF} />)

    expect(await screen.findByText('Unknown status')).toBeInTheDocument()
  })

  it('shows an error state when verification fails', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: false, status: 500 } as Response)))
    render(<AuditVerifiedBadge proofHash={PROOF} />)

    expect(await screen.findByText('Verification error')).toBeInTheDocument()
  })

  it('re-verifies when the Re-verify button is clicked', async () => {
    const fetchMock = mockVerify('unverified')
    render(<AuditVerifiedBadge proofHash={PROOF} />)
    await screen.findByText('Unverified')

    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ status: 'verified', proof_hash: PROOF, verified_at: null, message: 'ok' }),
    } as Response)

    await userEvent.click(screen.getByRole('button', { name: 'Re-verify enrollment' }))

    await waitFor(() => expect(screen.getByText('Enrollment verified')).toBeInTheDocument())
  })
})