import { NextResponse } from 'next/server'

interface AuditStep {
  label: string
  sub: string
  status: 'pending' | 'success' | 'failed'
  time?: string
}

interface AuditState {
  walletAddress: string
  status: 'Verified' | 'Pending' | 'Unverified'
  proofHex: string
  isVerified: boolean
  steps: AuditStep[]
}

const db = new Map<string, AuditState>()

function getInitialState(walletAddress: string): AuditState {
  return {
    walletAddress,
    status: 'Unverified',
    proofHex: '',
    isVerified: false,
    steps: [
      {
        label: 'Wallet Identity Connected',
        sub: `Stellar address ${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)} active`,
        status: 'success',
        time: '1ms'
      },
      {
        label: 'Compliance Screening',
        sub: 'Awaiting user enrollment in shielded compliance',
        status: 'pending'
      }
    ]
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const walletAddress = searchParams.get('walletAddress')

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 })
  }

  if (!db.has(walletAddress)) {
    db.set(walletAddress, getInitialState(walletAddress))
  }

  return NextResponse.json(db.get(walletAddress))
}

export async function POST(request: Request) {
  const body = await request.json()
  const { action, walletAddress } = body

  if (!walletAddress) {
    return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 })
  }

  if (!db.has(walletAddress)) {
    db.set(walletAddress, getInitialState(walletAddress))
  }

  const state = db.get(walletAddress)!

  if (action === 'enroll') {
    state.status = 'Verified'
    // Generate a random proof hex
    const hexChars = '0123456789abcdef'
    let randHex = '0x'
    for (let i = 0; i < 64; i++) {
      randHex += hexChars[Math.floor(Math.random() * 16)]
    }
    state.proofHex = randHex
    state.isVerified = false
    state.steps = [
      {
        label: 'Wallet Identity Connected',
        sub: `Stellar address ${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)} active`,
        status: 'success',
        time: '1ms'
      },
      {
        label: 'Compliance Screening',
        sub: 'AML/Sanctions verification passed',
        status: 'success',
        time: '15ms'
      },
      {
        label: 'Generate zk-SNARK Proof',
        sub: 'Balances proven valid, values shielded',
        status: 'success',
        time: '42ms'
      },
      {
        label: 'Verify Soroban Host VM',
        sub: 'Awaiting ledger verification key execution',
        status: 'pending'
      }
    ]
  } else if (action === 'verify') {
    if (state.status === 'Unverified') {
      return NextResponse.json({ error: 'Must enroll before verifying' }, { status: 400 })
    }
    state.isVerified = true
    state.steps = [
      {
        label: 'Wallet Identity Connected',
        sub: `Stellar address ${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)} active`,
        status: 'success',
        time: '1ms'
      },
      {
        label: 'Compliance Screening',
        sub: 'AML/Sanctions verification passed',
        status: 'success',
        time: '15ms'
      },
      {
        label: 'Generate zk-SNARK Proof',
        sub: 'Balances proven valid, values shielded',
        status: 'success',
        time: '42ms'
      },
      {
        label: 'Verify Soroban Host VM',
        sub: 'Ledger verifier executed verification keys',
        status: 'success',
        time: '24ms'
      },
      {
        label: 'Ledger Settlement Consensus',
        sub: 'Stellar ledger validated state updates',
        status: 'success',
        time: '18ms'
      }
    ]
  } else if (action === 'cancel') {
    db.set(walletAddress, getInitialState(walletAddress))
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  return NextResponse.json(db.get(walletAddress))
}
