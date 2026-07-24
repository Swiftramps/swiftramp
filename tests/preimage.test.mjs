import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import {
  toHex,
  fromHex,
  crc16XModem,
  decodeStellarAddress,
  encodeTimestamp,
  toUnixSeconds,
  buildPreimage,
  sha256Hex,
  hashesMatch,
  computePreimageDetails,
  offlineVerificationCommands,
  IDENTITY_BYTE_LENGTH,
  TIMESTAMP_BYTE_LENGTH,
  PreimageError,
} from '../src/lib/preimage.ts'

// A checksum-valid Stellar public key: version byte + 32 zero bytes + CRC16.
const ADDRESS = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF'
const QUEUE_ID = 'remit-queue-01'
const TIMESTAMP = '2026-03-15T08:00:00Z'

test('hex round-trips and tolerates a 0x prefix', () => {
  const bytes = Uint8Array.from([0x00, 0x0f, 0xff, 0xa1])
  assert.equal(toHex(bytes), '000fffa1')
  assert.deepEqual(fromHex('000fffa1'), bytes)
  assert.deepEqual(fromHex('0x000fffa1'), bytes)
  assert.throws(() => fromHex('xyz'), PreimageError)
  assert.throws(() => fromHex('abc'), PreimageError) // odd length
})

test('crc16XModem matches known vectors', () => {
  assert.equal(crc16XModem(new TextEncoder().encode('123456789')), 0x31c3)
  assert.equal(crc16XModem(new Uint8Array()), 0x0000)
})

test('decodeStellarAddress returns the raw 32-byte Ed25519 key', () => {
  const key = decodeStellarAddress(ADDRESS)
  assert.equal(key.length, IDENTITY_BYTE_LENGTH)
  // This particular address encodes an all-zero payload.
  assert.equal(toHex(key), '00'.repeat(32))
})

test('decodeStellarAddress rejects malformed and mistyped addresses', () => {
  assert.throws(() => decodeStellarAddress(''), PreimageError)
  assert.throws(() => decodeStellarAddress('NOTANADDRESS'), PreimageError)
  // right shape, wrong checksum: flip the final character
  const mistyped = ADDRESS.slice(0, 55) + (ADDRESS[55] === 'A' ? 'B' : 'A')
  assert.throws(() => decodeStellarAddress(mistyped), PreimageError)
})

test('encodeTimestamp is fixed-width big-endian', () => {
  assert.equal(toHex(encodeTimestamp(0)), '00'.repeat(8))
  assert.equal(toHex(encodeTimestamp(1)), '0000000000000001')
  assert.equal(toHex(encodeTimestamp(255)), '00000000000000ff')
  assert.equal(toHex(encodeTimestamp(256)), '0000000000000100')
  assert.equal(encodeTimestamp(1773556800).length, TIMESTAMP_BYTE_LENGTH)
  assert.throws(() => encodeTimestamp(-1), PreimageError)
  assert.throws(() => encodeTimestamp(1.5), PreimageError)
})

test('toUnixSeconds accepts ISO strings and passthrough numbers', () => {
  assert.equal(toUnixSeconds('1970-01-01T00:00:10Z'), 10)
  assert.equal(toUnixSeconds(1234), 1234)
  assert.throws(() => toUnixSeconds('not-a-date'), PreimageError)
})

test('buildPreimage concatenates identity || queueId || timestamp', () => {
  const parts = buildPreimage({ address: ADDRESS, queueId: QUEUE_ID, timestamp: TIMESTAMP })
  const queueBytes = new TextEncoder().encode(QUEUE_ID)

  assert.equal(parts.identityBytes.length, 32)
  assert.equal(parts.timestampBytes.length, 8)
  assert.equal(parts.preimage.length, 32 + queueBytes.length + 8)

  // Segments appear in order, unmodified.
  assert.deepEqual(parts.preimage.slice(0, 32), parts.identityBytes)
  assert.deepEqual(parts.preimage.slice(32, 32 + queueBytes.length), queueBytes)
  assert.deepEqual(parts.preimage.slice(32 + queueBytes.length), parts.timestampBytes)
})

test('buildPreimage rejects an empty queue id', () => {
  assert.throws(
    () => buildPreimage({ address: ADDRESS, queueId: '', timestamp: TIMESTAMP }),
    PreimageError,
  )
})

test('fixed-width timestamp keeps the preimage unambiguous', () => {
  // A queue id ending in digits must not be confusable with the timestamp.
  const a = buildPreimage({ address: ADDRESS, queueId: 'queue1', timestamp: 1 })
  const b = buildPreimage({ address: ADDRESS, queueId: 'queue', timestamp: 1 })
  assert.notEqual(toHex(a.preimage), toHex(b.preimage))
})

test('sha256Hex agrees with node:crypto', async () => {
  const bytes = new TextEncoder().encode('swiftramp')
  const expected = createHash('sha256').update(bytes).digest('hex')
  assert.equal(await sha256Hex(bytes), expected)
})

test('computePreimageDetails reproduces the digest an auditor would compute', async () => {
  const details = await computePreimageDetails(
    { address: ADDRESS, queueId: QUEUE_ID, timestamp: TIMESTAMP },
    undefined,
  )
  // Independently recompute from the published preimage hex.
  const independent = createHash('sha256')
    .update(Buffer.from(details.preimageHex, 'hex'))
    .digest('hex')
  assert.equal(details.computedHash, independent)
  assert.equal(details.identityHex.length, 64)
  assert.equal(details.timestampHex.length, 16)
})

test('computePreimageDetails reports match and mismatch against a recorded hash', async () => {
  const base = { address: ADDRESS, queueId: QUEUE_ID, timestamp: TIMESTAMP }
  const { computedHash } = await computePreimageDetails(base)

  assert.equal((await computePreimageDetails(base, computedHash)).matches, true)
  // Recorded hashes are often stored with a 0x prefix and/or uppercase.
  assert.equal((await computePreimageDetails(base, '0x' + computedHash.toUpperCase())).matches, true)
  assert.equal((await computePreimageDetails(base, 'deadbeef')).matches, false)
  assert.equal((await computePreimageDetails(base, undefined)).matches, false)
})

test('changing any single component changes the hash', async () => {
  const base = { address: ADDRESS, queueId: QUEUE_ID, timestamp: TIMESTAMP }
  const original = (await computePreimageDetails(base)).computedHash
  const otherQueue = (await computePreimageDetails({ ...base, queueId: 'other-queue' })).computedHash
  const otherTime = (await computePreimageDetails({ ...base, timestamp: '2026-03-16T08:00:00Z' })).computedHash

  assert.notEqual(original, otherQueue)
  assert.notEqual(original, otherTime)
})

test('hashesMatch normalizes prefix and case', () => {
  assert.equal(hashesMatch('abcd', 'ABCD'), true)
  assert.equal(hashesMatch('abcd', '0xabcd'), true)
  assert.equal(hashesMatch('abcd', ' abcd '), true)
  assert.equal(hashesMatch('abcd', 'abce'), false)
  assert.equal(hashesMatch('abcd', null), false)
})

test('offline commands embed the exact preimage hex', () => {
  const cmds = offlineVerificationCommands('00ff')
  for (const cmd of Object.values(cmds)) assert.ok(cmd.includes('00ff'))
  assert.ok(cmds.shasum.includes('sha') || cmds.shasum.includes('256'))
})
