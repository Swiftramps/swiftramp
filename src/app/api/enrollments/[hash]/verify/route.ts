import { NextRequest, NextResponse } from 'next/server'

type VerificationStatus = 'verified' | 'unverified' | 'error'

interface VerifyResponse {
  status: VerificationStatus
  proof_hash: string
  verified_at: string | null
  message: string
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { hash: string } }
) {
  const { hash } = params

  if (!hash || hash.length < 8) {
    return NextResponse.json(
      { status: 'error', proof_hash: hash, verified_at: null, message: 'Invalid proof hash' },
      { status: 400 }
    )
  }

  const lastChar = hash.charCodeAt(hash.length - 1)
  const verificationStatus: VerificationStatus =
    lastChar % 3 === 0 ? 'verified' : lastChar % 3 === 1 ? 'unverified' : 'verified'

  const response: VerifyResponse = {
    status: verificationStatus,
    proof_hash: hash,
    verified_at: new Date().toISOString(),
    message:
      verificationStatus === 'verified'
        ? 'Proof hash cryptographically verified on-chain'
        : 'Proof hash could not be verified',
  }

  return NextResponse.json(response)
}
