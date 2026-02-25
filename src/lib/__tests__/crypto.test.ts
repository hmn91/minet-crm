import { describe, it, expect, beforeAll } from 'vitest'
import { hashPIN, verifyPIN, isBiometricSupported } from '@/lib/crypto'

describe('hashPIN', () => {
  it('produces a 64-character hex string', async () => {
    const hash = await hashPIN('123456')
    expect(hash).toHaveLength(64)
    expect(hash).toMatch(/^[0-9a-f]+$/)
  })

  it('is deterministic — same input always yields same hash', async () => {
    const h1 = await hashPIN('123456')
    const h2 = await hashPIN('123456')
    expect(h1).toBe(h2)
  })

  it('different PINs produce different hashes', async () => {
    const h1 = await hashPIN('123456')
    const h2 = await hashPIN('654321')
    expect(h1).not.toBe(h2)
  })

  it('includes salt — bare hash of PIN differs from salted hash', async () => {
    const encoder = new TextEncoder()
    const data = encoder.encode('123456') // no salt
    const buf = await crypto.subtle.digest('SHA-256', data)
    const noSalt = Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    const withSalt = await hashPIN('123456')
    expect(withSalt).not.toBe(noSalt)
  })

  it('handles empty string', async () => {
    const hash = await hashPIN('')
    expect(hash).toHaveLength(64)
  })
})

describe('verifyPIN', () => {
  let storedHash: string

  beforeAll(async () => {
    storedHash = await hashPIN('123456')
  })

  it('returns true for the correct PIN', async () => {
    expect(await verifyPIN('123456', storedHash)).toBe(true)
  })

  it('returns false for an incorrect PIN', async () => {
    expect(await verifyPIN('000000', storedHash)).toBe(false)
  })

  it('returns false for empty string', async () => {
    expect(await verifyPIN('', storedHash)).toBe(false)
  })

  it('is case-sensitive for alphanumeric PINs', async () => {
    const hashA = await hashPIN('12345A')
    const hashB = await hashPIN('12345a')
    expect(hashA).not.toBe(hashB)
  })
})

describe('isBiometricSupported', () => {
  it('returns true when PublicKeyCredential and navigator.credentials are present', () => {
    // setup.ts stubs navigator.credentials and PublicKeyCredential
    expect(isBiometricSupported()).toBe(true)
  })

  it('returns false when navigator.credentials is absent', () => {
    const original = Object.getOwnPropertyDescriptor(navigator, 'credentials')
    Object.defineProperty(navigator, 'credentials', {
      value: undefined,
      writable: true,
      configurable: true,
    })
    expect(isBiometricSupported()).toBe(false)
    if (original) {
      Object.defineProperty(navigator, 'credentials', original)
    }
  })

  it('returns false when PublicKeyCredential is absent', () => {
    const orig = (globalThis as Record<string, unknown>).PublicKeyCredential
    delete (globalThis as Record<string, unknown>).PublicKeyCredential
    expect(isBiometricSupported()).toBe(false)
    ;(globalThis as Record<string, unknown>).PublicKeyCredential = orig
  })
})
