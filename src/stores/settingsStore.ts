import { create } from 'zustand'
import type { AppSettings } from '@/types'
import { DEFAULT_SETTINGS } from '@/types'
import { getAllSettings, saveAllSettings } from '@/lib/db'

interface SettingsStore {
  settings: AppSettings
  isLoaded: boolean
  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  isLoaded: false,

  load: async () => {
    const stored = await getAllSettings()
    set({
      settings: { ...DEFAULT_SETTINGS, ...stored },
      isLoaded: true,
    })
  },

  update: async (partial) => {
    const next = { ...get().settings, ...partial }
    set({ settings: next })
    await saveAllSettings(partial)
  },
}))
