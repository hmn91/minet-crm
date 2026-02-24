// ============================================================
// PIN Security using SubtleCrypto (native browser API)
// ============================================================

const PIN_SALT = 'MiNet-CRM-v1-salt'

export async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin + PIN_SALT)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPIN(pin: string, storedHash: string): Promise<boolean> {
  const hash = await hashPIN(pin)
  return hash === storedHash
}

// ============================================================
// WebAuthn / Biometric Authentication
// ============================================================

const WEBAUTHN_RP_ID = window.location.hostname
const WEBAUTHN_RP_NAME = 'MiNet CRM'

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

export function isBiometricSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof navigator.credentials?.create === 'function' &&
    typeof navigator.credentials?.get === 'function'
  )
}

export async function registerBiometric(userId: string): Promise<string> {
  if (!isBiometricSupported()) throw new Error('Biometric not supported')

  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const userIdBytes = new TextEncoder().encode(userId)

  const credential = await navigator.credentials.create({
    publicKey: {
      challenge,
      rp: {
        id: WEBAUTHN_RP_ID,
        name: WEBAUTHN_RP_NAME,
      },
      user: {
        id: userIdBytes,
        name: userId,
        displayName: 'MiNet CRM User',
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },   // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        requireResidentKey: false,
        userVerification: 'required',
      },
      timeout: 60000,
    },
  }) as PublicKeyCredential

  const rawId = credential.rawId
  return uint8ArrayToBase64(new Uint8Array(rawId))
}

export async function authenticateBiometric(credentialId: string): Promise<boolean> {
  if (!isBiometricSupported()) return false

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32))
    const credentialIdBytes = base64ToUint8Array(credentialId)

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [
          {
            id: credentialIdBytes.buffer as ArrayBuffer,
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      },
    })

    return !!assertion
  } catch {
    return false
  }
}
