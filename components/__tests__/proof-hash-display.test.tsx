import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProofHashDisplay from '../ProofHashDisplay'

const PROOF = '0x3a4b92c81d7f6e0b5a3c8d9e2f4a1c5b8d9e0f3a6b2c7d9a1e0f3b4c5d6e7f8'

describe('ProofHashDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the proof hex and metadata', () => {
    render(
      <ProofHashDisplay
        isLoading={false}
        proofHex={PROOF}
        proofType="zk-SNARK / Groth16"
        curve="BN254"
        computationTimeMs={120}
      />,
    )

    expect(screen.getByText('Cryptographic Proof')).toBeInTheDocument()
    expect(screen.getByText(PROOF)).toBeInTheDocument()
    expect(screen.getByText('zk-SNARK')).toBeInTheDocument()
    expect(screen.getByText('BN254 (Verified on-chain)')).toBeInTheDocument()
  })

  it('copies the proof hex when the hex box is clicked', async () => {
    const user = userEvent.setup()
    render(<ProofHashDisplay isLoading={false} proofHex={PROOF} />)

    await user.click(screen.getByText(PROOF))

    expect(await screen.findByText('✓ Copied')).toBeInTheDocument()
  })

  it('shows the loading skeleton while isLoading is true', () => {
    render(<ProofHashDisplay isLoading />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByLabelText('Loading proof hash details')).toBeInTheDocument()
  })
})
