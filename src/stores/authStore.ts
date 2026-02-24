import { create } from 'zustand'
import type { UserProfile } from '@/types'

interface AuthStore {
  isAuthenticated: boolean
  isPinLocked: boolean
  userProfile: UserProfile | null
  googleAccessToken: string | null  // In-memory only

  setAuthenticated: (value: boolean) => void
  setPinLocked: (value: boolean) => void
  setUserProfile: (profile: UserProfile | null) => void
  setGoogleAccessToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthStore>((set) => ({
  isAuthenticated: false,
  isPinLocked: false,
  userProfile: null,
  googleAccessToken: null,

  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setPinLocked: (value) => set({ isPinLocked: value }),
  setUserProfile: (profile) => set({ userProfile: profile }),
  setGoogleAccessToken: (token) => set({ googleAccessToken: token }),

  logout: () =>
    set({
      isAuthenticated: false,
      googleAccessToken: null,
    }),
}))
