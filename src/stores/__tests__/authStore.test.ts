import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from '@/stores/authStore'

beforeEach(() => {
  // Reset to initial state before each test
  useAuthStore.setState({
    isAuthenticated: false,
    isPinLocked: false,
    userProfile: null,
    googleAccessToken: null,
  })
})

describe('setAuthenticated', () => {
  it('sets isAuthenticated to true', () => {
    useAuthStore.getState().setAuthenticated(true)
    expect(useAuthStore.getState().isAuthenticated).toBe(true)
  })

  it('sets isAuthenticated to false', () => {
    useAuthStore.getState().setAuthenticated(true)
    useAuthStore.getState().setAuthenticated(false)
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})

describe('setPinLocked', () => {
  it('locks the app', () => {
    useAuthStore.getState().setPinLocked(true)
    expect(useAuthStore.getState().isPinLocked).toBe(true)
  })

  it('unlocks the app', () => {
    useAuthStore.getState().setPinLocked(true)
    useAuthStore.getState().setPinLocked(false)
    expect(useAuthStore.getState().isPinLocked).toBe(false)
  })
})

describe('setUserProfile', () => {
  it('stores user profile', () => {
    const profile = { id: 'current-user' as const, displayName: 'Ngọc', updatedAt: new Date().toISOString() }
    useAuthStore.getState().setUserProfile(profile)
    expect(useAuthStore.getState().userProfile?.displayName).toBe('Ngọc')
  })

  it('clears user profile when null', () => {
    useAuthStore.getState().setUserProfile({ id: 'current-user', displayName: 'X', updatedAt: '' })
    useAuthStore.getState().setUserProfile(null)
    expect(useAuthStore.getState().userProfile).toBeNull()
  })
})

describe('setGoogleAccessToken', () => {
  it('stores the token', () => {
    useAuthStore.getState().setGoogleAccessToken('test-token-123')
    expect(useAuthStore.getState().googleAccessToken).toBe('test-token-123')
  })

  it('clears the token', () => {
    useAuthStore.getState().setGoogleAccessToken('test-token-123')
    useAuthStore.getState().setGoogleAccessToken(null)
    expect(useAuthStore.getState().googleAccessToken).toBeNull()
  })
})

describe('logout', () => {
  it('sets isAuthenticated to false', () => {
    useAuthStore.setState({ isAuthenticated: true })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('clears googleAccessToken', () => {
    useAuthStore.setState({ googleAccessToken: 'secret-token' })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().googleAccessToken).toBeNull()
  })

  it('preserves userProfile after logout (intentional design)', () => {
    const profile = { id: 'current-user' as const, displayName: 'Ngọc', updatedAt: '' }
    useAuthStore.setState({ userProfile: profile, isAuthenticated: true })
    useAuthStore.getState().logout()
    // userProfile is intentionally NOT cleared on logout
    expect(useAuthStore.getState().userProfile?.displayName).toBe('Ngọc')
  })

  it('does NOT clear isPinLocked', () => {
    useAuthStore.setState({ isPinLocked: true })
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().isPinLocked).toBe(true)
  })
})
