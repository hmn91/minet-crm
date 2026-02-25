import { describe, it, expect, beforeEach } from 'vitest'
import {
  db,
  getSetting,
  setSetting,
  getAllSettings,
  saveAllSettings,
  exportAllData,
  importAllData,
  clearAllData,
  getUserProfile,
  saveUserProfile,
} from '@/lib/db'
import { resetDb } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('getSetting / setSetting', () => {
  it('stores and retrieves a boolean setting', async () => {
    await setSetting('pinEnabled', true)
    const val = await getSetting('pinEnabled')
    expect(val).toBe(true)
  })

  it('stores and retrieves a string setting', async () => {
    await setSetting('darkMode', 'dark')
    const val = await getSetting('darkMode')
    expect(val).toBe('dark')
  })

  it('returns undefined for a setting that has not been set', async () => {
    const val = await getSetting('pinHash')
    expect(val).toBeUndefined()
  })

  it('overwrites an existing setting', async () => {
    await setSetting('darkMode', 'light')
    await setSetting('darkMode', 'dark')
    const val = await getSetting('darkMode')
    expect(val).toBe('dark')
  })
})

describe('getAllSettings / saveAllSettings', () => {
  it('saves and retrieves multiple settings at once', async () => {
    await saveAllSettings({ pinEnabled: true, darkMode: 'dark', language: 'vi' })
    const all = await getAllSettings()
    expect(all.pinEnabled).toBe(true)
    expect(all.darkMode).toBe('dark')
    expect(all.language).toBe('vi')
  })

  it('returns empty object when no settings exist', async () => {
    const all = await getAllSettings()
    expect(all).toEqual({})
  })
})

describe('exportAllData / importAllData / clearAllData', () => {
  it('exports empty DB correctly', async () => {
    const data = await exportAllData()
    expect(data.contacts).toEqual([])
    expect(data.companies).toEqual([])
    expect(data.interactions).toEqual([])
  })

  it('exports and reimports data with matching counts', async () => {
    // Seed some data
    await db.contacts.add({
      id: 'c1',
      firstName: 'A',
      lastName: 'B',
      tier: 'A',
      relationshipType: 'customer',
      tags: [],
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await db.companies.add({
      id: 'co1',
      name: 'Corp',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    const exported = await exportAllData()
    expect(exported.contacts).toHaveLength(1)
    expect(exported.companies).toHaveLength(1)

    await clearAllData()
    expect(await db.contacts.count()).toBe(0)

    await importAllData(exported)
    expect(await db.contacts.count()).toBe(1)
    expect(await db.companies.count()).toBe(1)
  })

  it('clearAllData empties all 7 tables', async () => {
    await db.contacts.add({
      id: 'c1',
      firstName: 'A',
      lastName: 'B',
      tier: 'B',
      relationshipType: 'other',
      tags: [],
      customFields: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    await db.tags.add({ id: 't1', name: 'VIP', color: '#ff0000', createdAt: new Date().toISOString() })

    await clearAllData()

    expect(await db.contacts.count()).toBe(0)
    expect(await db.tags.count()).toBe(0)
  })
})

describe('getUserProfile / saveUserProfile', () => {
  it('returns undefined when no profile exists', async () => {
    const profile = await getUserProfile()
    expect(profile).toBeUndefined()
  })

  it('saves and retrieves user profile', async () => {
    await saveUserProfile({
      id: 'current-user',
      displayName: 'Nguyễn Test',
      updatedAt: new Date().toISOString(),
    })
    const profile = await getUserProfile()
    expect(profile?.displayName).toBe('Nguyễn Test')
  })

  it('overwrites existing profile', async () => {
    await saveUserProfile({ id: 'current-user', displayName: 'Old Name', updatedAt: new Date().toISOString() })
    await saveUserProfile({ id: 'current-user', displayName: 'New Name', updatedAt: new Date().toISOString() })
    const profile = await getUserProfile()
    expect(profile?.displayName).toBe('New Name')
  })
})
