import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import IdentityStatus from '../IdentityStatus'

const ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'

describe('IdentityStatus', () => {
  it('renders the Verified state with compliance pills', () => {
    render(<IdentityStatus isLoading={false} walletAddress={ADDRESS} status="Verified" kycTier="Tier 2" />)

    expect(screen.getByText('Identity & Compliance')).toBeInTheDocument()
    expect(screen.getByText(ADDRESS)).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
    expect(screen.getByText('✓ AML Checked')).toBeInTheDocument()
    expect(screen.getByText('✓ Geo Verified')).toBeInTheDocument()
  })

  it('renders the Pending state', () => {
    render(<IdentityStatus isLoading={false} walletAddress={ADDRESS} status="Pending" />)

    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  it('renders the Unverified state with an enroll action', async () => {
    const onEnroll = vi.fn()
    render(<IdentityStatus isLoading={false} walletAddress={ADDRESS} status="Unverified" onEnroll={onEnroll} />)

    expect(screen.getByText('Unverified')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Enroll in Shielded Compliance' }))
    expect(onEnroll).toHaveBeenCalledTimes(1)
  })

  it('shows a cancel action for non-unverified statuses when onCancel is provided', async () => {
    const onCancel = vi.fn()
    render(<IdentityStatus isLoading={false} walletAddress={ADDRESS} status="Verified" onCancel={onCancel} />)

    await userEvent.click(screen.getByRole('button', { name: 'Cancel Enrollment' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows the loading skeleton while isLoading is true', () => {
    render(<IdentityStatus isLoading />)

    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByLabelText('Loading identity compliance status')).toBeInTheDocument()
  })
})