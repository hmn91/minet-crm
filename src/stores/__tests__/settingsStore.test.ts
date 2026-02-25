import { describe, it, expect, beforeEach } from 'vitest'
import { useSettingsStore } from '@/stores/settingsStore'
import { DEFAULT_SETTINGS } from '@/types'
import { db } from '@/lib/db'
import { resetDb } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
  // Reset store to initial state
  useSettingsStore.setState({
    settings: { ...DEFAULT_SETTINGS },
    isLoaded: false,
  })
})

describe('initial state', () => {
  it('starts with DEFAULT_SETTINGS', () => {
    const { settings } = useSettingsStore.getState()
    expect(settings.pinEnabled).toBe(false)
    expect(settings.darkMode).toBe('system')
    expect(settings.language).toBe('vi')
    expect(settings.reminderLeadDays).toBe(3)
  })

  it('starts with isLoaded=false', () => {
    expect(useSettingsStore.getState().isLoaded).toBe(false)
  })
})

describe('load()', () => {
  it('sets isLoaded=true after loading', async () => {
    await useSettingsStore.getState().load()
    expect(useSettingsStore.getState().isLoaded).toBe(true)
  })

  it('merges stored settings with DEFAULT_SETTINGS', async () => {
    // Pre-store some settings in DB
    await db.appSettings.put({ key: 'pinEnabled', value: true })
    await db.appSettings.put({ key: 'darkMode', value: 'dark' })

    await useSettingsStore.getState().load()

    const { settings } = useSettingsStore.getState()
    expect(settings.pinEnabled).toBe(true)
    expect(settings.darkMode).toBe('dark')
    // Other settings from DEFAULT_SETTINGS should be preserved
    expect(settings.language).toBe('vi')
    expect(settings.reminderLeadDays).toBe(3)
  })

  it('keeps DEFAULT_SETTINGS values for keys not stored in DB', async () => {
    await db.appSettings.put({ key: 'pinEnabled', value: true })
    await useSettingsStore.getState().load()
    const { settings } = useSettingsStore.getState()
    expect(settings.autoBackupEnabled).toBe(false)
    expect(settings.notificationsEnabled).toBe(false)
  })
})

describe('update()', () => {
  it('updates in-memory settings immediately', async () => {
    await useSettingsStore.getState().update({ darkMode: 'dark' })
    expect(useSettingsStore.getState().settings.darkMode).toBe('dark')
  })

  it('persists settings to DB', async () => {
    await useSettingsStore.getState().update({ pinEnabled: true })
    const record = await db.appSettings.get('pinEnabled')
    expect(record?.value).toBe(true)
  })

  it('merges partial update — other settings unchanged', async () => {
    // Set initial custom state
    useSettingsStore.setState({
      settings: { ...DEFAULT_SETTINGS, reminderLeadDays: 7, language: 'vi' },
      isLoaded: true,
    })
    await useSettingsStore.getState().update({ darkMode: 'light' })
    const { settings } = useSettingsStore.getState()
    expect(settings.reminderLeadDays).toBe(7) // unchanged
    expect(settings.language).toBe('vi') // unchanged
    expect(settings.darkMode).toBe('light') // updated
  })
})
