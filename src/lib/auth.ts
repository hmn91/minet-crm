// ============================================================
// Google Identity Services (GIS) Authentication
// ============================================================

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

// Login chỉ dùng basic scopes (không cần Google verification)
const LOGIN_SCOPE = 'openid profile email'
// Drive scope request riêng khi user bật backup
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'

interface GoogleUserInfo {
  id: string
  name: string
  given_name: string
  family_name: string
  picture: string
  email: string
}

interface TokenResponse {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

let loginClient: google.accounts.oauth2.TokenClient | null = null
let driveClient: google.accounts.oauth2.TokenClient | null = null
let currentAccessToken: string | null = null
let currentDriveToken: string | null = null

export function initGoogleAuth(): void {
  if (!GOOGLE_CLIENT_ID || !window.google?.accounts?.oauth2) return

  loginClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: LOGIN_SCOPE,
    callback: () => {},
  })

  driveClient = window.google.accounts.oauth2.initTokenClient({
    client_id: GOOGLE_CLIENT_ID,
    scope: DRIVE_SCOPE,
    callback: () => {},
  })
}

export async function signInWithGoogle(): Promise<{ accessToken: string; userInfo: GoogleUserInfo }> {
  return new Promise((resolve, reject) => {
    if (!loginClient) {
      reject(new Error('Google auth chưa được khởi tạo. Kiểm tra VITE_GOOGLE_CLIENT_ID.'))
      return
    }

    loginClient.callback = (async (resp: TokenResponse & { error?: string }) => {
      if (resp.error) {
        reject(new Error(`Google OAuth error: ${resp.error}`))
        return
      }
      currentAccessToken = resp.access_token
      try {
        const userInfo = await fetchGoogleUserInfo(resp.access_token)
        resolve({ accessToken: resp.access_token, userInfo })
      } catch (err) {
        reject(err)
      }
    }) as (resp: unknown) => void

    loginClient.requestAccessToken({ prompt: 'select_account' })
  })
}

// Gọi riêng khi user bật Google Drive backup trong Settings
export async function requestDriveAccess(): Promise<string> {
  if (currentDriveToken) return currentDriveToken

  return new Promise((resolve, reject) => {
    if (!driveClient) {
      reject(new Error('Google auth chưa được khởi tạo.'))
      return
    }

    driveClient.callback = ((resp: TokenResponse & { error?: string }) => {
      if (resp.error) {
        reject(new Error(`Drive OAuth error: ${resp.error}`))
        return
      }
      currentDriveToken = resp.access_token
      resolve(resp.access_token)
    }) as (resp: unknown) => void

    driveClient.requestAccessToken({ prompt: '' })
  })
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<GoogleUserInfo> {
  const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) throw new Error('Không thể lấy thông tin Google')
  return response.json() as Promise<GoogleUserInfo>
}

export function signOutGoogle(): void {
  if (window.google?.accounts?.oauth2) {
    if (currentAccessToken) window.google.accounts.oauth2.revoke(currentAccessToken, () => {})
    if (currentDriveToken) window.google.accounts.oauth2.revoke(currentDriveToken, () => {})
  }
  currentAccessToken = null
  currentDriveToken = null
}

export function getCurrentGoogleToken(): string | null {
  return currentAccessToken
}

export function getCurrentDriveToken(): string | null {
  return currentDriveToken
}

// Type augmentation for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: unknown) => void
          }) => google.accounts.oauth2.TokenClient
          revoke: (token: string, callback: () => void) => void
        }
      }
    }
  }
}

declare namespace google {
  namespace accounts.oauth2 {
    interface TokenClient {
      callback: (resp: unknown) => void
      requestAccessToken: (opts?: { prompt?: string }) => void
    }
  }
}
