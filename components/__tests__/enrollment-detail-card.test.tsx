import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnrollmentDetailCard from '../EnrollmentDetailCard'

const HASH = 'a1b2c3d4e5f60718293a4b5c6d7e8f901a2b3c4d5e6f708192a3b4c5d6e7f8091a'
const ADDRESS = 'GCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

describe('EnrollmentDetailCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the proof hash as 64-char hex with the identity', () => {
    render(<EnrollmentDetailCard address={ADDRESS} proofHash={HASH} />)

    expect(screen.getByText('Enrollment Detail')).toBeInTheDocument()
    expect(screen.getByText('Proof Hash')).toBeInTheDocument()
    expect(screen.getByText(HASH)).toBeInTheDocument()
    expect(screen.getByText(ADDRESS)).toBeInTheDocument()
  })

  it('strips a 0x prefix before displaying the hash', () => {
    render(<EnrollmentDetailCard address={ADDRESS} proofHash={`0x${HASH}`} />)

    expect(screen.getByText(HASH)).toBeInTheDocument()
    expect(screen.queryByText(`0x${HASH}`)).not.toBeInTheDocument()
  })

  it('copies the hash when the hash box is clicked', async () => {
    const user = userEvent.setup()
    render(<EnrollmentDetailCard address={ADDRESS} proofHash={HASH} />)

    await user.click(screen.getByLabelText('Copy proof hash'))

    expect(await screen.findByText('✓ Copied')).toBeInTheDocument()
  })

  it('renders queue and timestamp when provided', () => {
    render(
      <EnrollmentDetailCard
        address={ADDRESS}
        proofHash={HASH}
        queueId="remit-queue-01"
        timestamp="2026-03-15 08:00:00 UTC"
      />,
    )

    expect(screen.getByText('remit-queue-01')).toBeInTheDocument()
    expect(screen.getByText('2026-03-15 08:00:00 UTC')).toBeInTheDocument()
  })
})
