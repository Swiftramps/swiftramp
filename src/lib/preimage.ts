/**
 * Proof-hash preimage construction and verification (issue #39).
 *
 * A proof hash commits to three things: WHO enrolled, WHICH queue they enrolled
 * in, and WHEN. Auditors need to reproduce that commitment independently, so the
 * exact byte layout is defined here and nowhere else:
 *
 *   preimage = identity_bytes (32) || queue_id_bytes (UTF-8) || timestamp (8, big-endian)
 *   proof_hash = SHA-256(preimage)
 *
 * `identity_bytes` is the raw Ed25519 public key recovered from the Stellar
 * StrKey address, not the "G..." text. Encoding the timestamp big-endian in a
 * fixed 8 bytes keeps the preimage unambiguous: without a fixed width, a queue
 * id ending in digits could be confused with the start of the timestamp.
 *
 * Everything here is pure and dependency-free so it can be unit tested and, more
 * importantly, so an auditor can re-implement it from this file alone.
 */

/** Byte length of an Ed25519 public key. */
export const IDENTITY_BYTE_LENGTH = 32
/** Fixed width used to encode the timestamp, in bytes. */
export const TIMESTAMP_BYTE_LENGTH = 8

// Stellar StrKey uses RFC 4648 base32 with no padding.
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
/** Version byte for an Ed25519 public key ("G" addresses): 6 << 3. */
const VERSION_BYTE_ED25519_PUBLIC_KEY = 6 << 3

export class PreimageError extends Error {
  readonly code: string
  constructor(code: string, message: string) {
    super(message)
    this.name = 'PreimageError'
    this.code = code
  }
}

/** Lowercase hex encoding, no prefix. */
export function toHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

/** Decode hex (with or without a `0x` prefix) into bytes. */
export function fromHex(hex: string): Uint8Array {
  const clean = hex.trim().replace(/^0x/i, '')
  if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) {
    throw new PreimageError('INVALID_HEX', `Not a valid hex string: "${hex}"`)
  }
  const out = new Uint8Array(clean.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

/** Decode unpadded base32 (RFC 4648) into bytes. */
function base32Decode(input: string): Uint8Array {
  let bits = 0
  let value = 0
  const out: number[] = []
  for (let i = 0; i < input.length; i++) {
    const char = input.charAt(i)
    const idx = BASE32_ALPHABET.indexOf(char)
    if (idx === -1) {
      throw new PreimageError('INVALID_ADDRESS', `Invalid base32 character: "${char}"`)
    }
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      bits -= 8
      out.push((value >>> bits) & 0xff)
    }
  }
  return Uint8Array.from(out)
}

/**
 * CRC16-XModem, the checksum Stellar StrKey appends. Verifying it means a
 * mistyped address is rejected here rather than silently producing a wrong hash.
 */
export function crc16XModem(bytes: Uint8Array): number {
  let crc = 0x0000
  for (let b = 0; b < bytes.length; b++) {
    crc ^= bytes[b] << 8
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc & 0xffff
}

/**
 * Recover the raw 32-byte Ed25519 public key from a Stellar "G..." address.
 * Layout: [version 1][payload 32][crc16 2] = 35 bytes, base32-encoded to 56 chars.
 */
export function decodeStellarAddress(address: string): Uint8Array {
  const value = (address ?? '').trim()
  if (!/^G[A-Z2-7]{55}$/.test(value)) {
    throw new PreimageError(
      'INVALID_ADDRESS',
      'Expected a 56-character Stellar public key beginning with "G"',
    )
  }

  const decoded = base32Decode(value)
  if (decoded.length !== 1 + IDENTITY_BYTE_LENGTH + 2) {
    throw new PreimageError('INVALID_ADDRESS', 'Address does not decode to 35 bytes')
  }
  if (decoded[0] !== VERSION_BYTE_ED25519_PUBLIC_KEY) {
    throw new PreimageError('INVALID_ADDRESS', 'Address is not an Ed25519 public key')
  }

  const payload = decoded.subarray(0, 1 + IDENTITY_BYTE_LENGTH)
  const expected = decoded[decoded.length - 2] | (decoded[decoded.length - 1] << 8)
  if (crc16XModem(payload) !== expected) {
    throw new PreimageError('INVALID_ADDRESS', 'Address checksum does not match')
  }

  return decoded.slice(1, 1 + IDENTITY_BYTE_LENGTH)
}

/** Encode a timestamp as an unsigned big-endian integer in a fixed 8 bytes. */
export function encodeTimestamp(unixSeconds: number): Uint8Array {
  if (!Number.isFinite(unixSeconds) || !Number.isInteger(unixSeconds) || unixSeconds < 0) {
    throw new PreimageError('INVALID_TIMESTAMP', 'Timestamp must be a non-negative integer')
  }
  if (!Number.isSafeInteger(unixSeconds)) {
    throw new PreimageError('INVALID_TIMESTAMP', 'Timestamp exceeds the safe integer range')
  }
  // Plain integer math (no BigInt): unix seconds are far below 2^53, so the
  // division is exact and this stays compatible with the project's es5 target.
  const out = new Uint8Array(TIMESTAMP_BYTE_LENGTH)
  let remaining = unixSeconds
  for (let i = TIMESTAMP_BYTE_LENGTH - 1; i >= 0; i--) {
    out[i] = remaining % 256
    remaining = Math.floor(remaining / 256)
  }
  return out
}

/** Convert an ISO-8601 string (or epoch seconds) to whole unix seconds. */
export function toUnixSeconds(timestamp: string | number): number {
  if (typeof timestamp === 'number') return Math.floor(timestamp)
  const ms = Date.parse(timestamp)
  if (Number.isNaN(ms)) {
    throw new PreimageError('INVALID_TIMESTAMP', `Unparseable timestamp: "${timestamp}"`)
  }
  return Math.floor(ms / 1000)
}

export interface PreimageInput {
  /** Stellar "G..." address of the enrolling identity. */
  address: string
  /** Queue identifier, hashed as UTF-8 bytes. */
  queueId: string
  /** ISO-8601 string or unix seconds. */
  timestamp: string | number
}

export interface PreimageParts {
  identityBytes: Uint8Array
  queueIdBytes: Uint8Array
  timestampBytes: Uint8Array
  /** The exact byte sequence passed to SHA-256. */
  preimage: Uint8Array
  unixSeconds: number
}

/** Assemble the three components into the canonical preimage. */
export function buildPreimage({ address, queueId, timestamp }: PreimageInput): PreimageParts {
  if (typeof queueId !== 'string' || queueId.length === 0) {
    throw new PreimageError('INVALID_QUEUE_ID', 'queueId must be a non-empty string')
  }
  const identityBytes = decodeStellarAddress(address)
  const queueIdBytes = new TextEncoder().encode(queueId)
  const unixSeconds = toUnixSeconds(timestamp)
  const timestampBytes = encodeTimestamp(unixSeconds)

  const preimage = new Uint8Array(
    identityBytes.length + queueIdBytes.length + timestampBytes.length,
  )
  preimage.set(identityBytes, 0)
  preimage.set(queueIdBytes, identityBytes.length)
  preimage.set(timestampBytes, identityBytes.length + queueIdBytes.length)

  return { identityBytes, queueIdBytes, timestampBytes, preimage, unixSeconds }
}

/** SHA-256 via Web Crypto (available in browsers and Node 18+). */
export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const subtle = globalThis.crypto?.subtle
  if (!subtle) {
    throw new PreimageError('NO_WEBCRYPTO', 'Web Crypto (crypto.subtle) is unavailable')
  }
  const digest = await subtle.digest('SHA-256', bytes as unknown as BufferSource)
  return toHex(new Uint8Array(digest))
}

/**
 * Compare a computed digest with a recorded proof hash, ignoring an optional
 * `0x` prefix and case differences.
 */
export function hashesMatch(computed: string, recorded: string | undefined | null): boolean {
  if (!recorded) return false
  const normalize = (v: string) => v.trim().replace(/^0x/i, '').toLowerCase()
  return normalize(computed) === normalize(recorded)
}

export interface PreimageDetailsResult extends PreimageParts {
  identityHex: string
  queueIdHex: string
  timestampHex: string
  preimageHex: string
  /** SHA-256 of `preimage`, lowercase hex, no prefix. */
  computedHash: string
  /** True when `computedHash` equals the recorded proof hash. */
  matches: boolean
}

/**
 * Full derivation for the auditor panel: every intermediate value an auditor
 * needs in order to reproduce the hash by hand.
 */
export async function computePreimageDetails(
  input: PreimageInput,
  recordedHash?: string,
): Promise<PreimageDetailsResult> {
  const parts = buildPreimage(input)
  const computedHash = await sha256Hex(parts.preimage)
  return {
    ...parts,
    identityHex: toHex(parts.identityBytes),
    queueIdHex: toHex(parts.queueIdBytes),
    timestampHex: toHex(parts.timestampBytes),
    preimageHex: toHex(parts.preimage),
    computedHash,
    matches: hashesMatch(computedHash, recordedHash),
  }
}

/** Shell/Node one-liners an auditor can run offline to reproduce the digest. */
export function offlineVerificationCommands(preimageHex: string) {
  return {
    shasum: `printf '%s' '${preimageHex}' | xxd -r -p | shasum -a 256`,
    openssl: `printf '%s' '${preimageHex}' | xxd -r -p | openssl dgst -sha256`,
    node: `node -e "console.log(require('crypto').createHash('sha256').update(Buffer.from('${preimageHex}','hex')).digest('hex'))"`,
    python: `python3 -c "import hashlib;print(hashlib.sha256(bytes.fromhex('${preimageHex}')).hexdigest())"`,
  }
}
