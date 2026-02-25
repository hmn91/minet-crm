import '@testing-library/jest-dom'
import { indexedDB, IDBKeyRange } from 'fake-indexeddb'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

// Inject fake IndexedDB globally — Dexie will use this instead of real IDB
Object.defineProperty(globalThis, 'indexedDB', {
  value: indexedDB,
  writable: true,
  configurable: true,
})
Object.defineProperty(globalThis, 'IDBKeyRange', {
  value: IDBKeyRange,
  writable: true,
  configurable: true,
})

// Ensure WebCrypto is available (happy-dom may not implement SubtleCrypto fully)
if (!globalThis.crypto?.subtle) {
  const { webcrypto } = await import('node:crypto')
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  })
}

// Stub WebAuthn — requires real hardware in production
Object.defineProperty(navigator, 'credentials', {
  value: {
    create: vi.fn().mockResolvedValue({
      rawId: new Uint8Array([1, 2, 3]).buffer,
      type: 'public-key',
    }),
    get: vi.fn().mockResolvedValue({
      type: 'public-key',
    }),
  },
  writable: true,
  configurable: true,
})

// Stub PublicKeyCredential
Object.defineProperty(globalThis, 'PublicKeyCredential', {
  value: class {},
  writable: true,
  configurable: true,
})

// Stub Notification API
Object.defineProperty(globalThis, 'Notification', {
  value: Object.assign(
    function Notification() {},
    {
      permission: 'default' as NotificationPermission,
      requestPermission: vi.fn().mockResolvedValue('granted'),
    }
  ),
  writable: true,
  configurable: true,
})

// Clean up React trees after each test
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})
