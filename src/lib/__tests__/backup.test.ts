import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createBackupPayload, restoreFromLocalFile } from '@/lib/backup'
import { db } from '@/lib/db'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('createBackupPayload', () => {
  it('returns a valid BackupData structure with correct version and appName', async () => {
    const payload = await createBackupPayload()
    expect(payload.version).toBe('1.0')
    expect(payload.appName).toBe('MiNet CRM')
    expect(payload.exportedAt).toBeDefined()
    expect(payload.data).toBeDefined()
    expect(Array.isArray(payload.data.contacts)).toBe(true)
    expect(Array.isArray(payload.data.companies)).toBe(true)
    expect(Array.isArray(payload.data.events)).toBe(true)
    expect(Array.isArray(payload.data.reminders)).toBe(true)
  })

  it('includes seeded contacts in the payload', async () => {
    await seedContact({ firstName: 'Backup', lastName: 'Test' })
    const payload = await createBackupPayload()
    expect(payload.data.contacts).toHaveLength(1)
    expect(payload.data.contacts[0].firstName).toBe('Backup')
  })
})

describe('restoreFromLocalFile', () => {
  it('throws "File backup không hợp lệ" for JSON missing version and data', async () => {
    const file = new File(['{}'], 'backup.json', { type: 'application/json' })
    await expect(restoreFromLocalFile(file)).rejects.toThrow('File backup không hợp lệ')
  })

  it('throws "File backup không hợp lệ" for JSON missing data', async () => {
    const file = new File(
      [JSON.stringify({ version: '1.0' })],
      'backup.json',
      { type: 'application/json' }
    )
    await expect(restoreFromLocalFile(file)).rejects.toThrow('File backup không hợp lệ')
  })

  it('throws for invalid JSON', async () => {
    const file = new File(['not-json'], 'backup.json', { type: 'application/json' })
    await expect(restoreFromLocalFile(file)).rejects.toThrow()
  })

  it('restores contacts from a valid backup file', async () => {
    // Seed a contact then export
    await seedContact({ firstName: 'Restored', lastName: 'Contact' })
    const { createBackupPayload: getPayload } = await import('@/lib/backup')
    const payload = await getPayload()

    // Clear DB
    await db.contacts.clear()
    expect(await db.contacts.count()).toBe(0)

    // Restore
    const json = JSON.stringify(payload)
    const file = new File([json], 'backup.json', { type: 'application/json' })
    await restoreFromLocalFile(file)

    expect(await db.contacts.count()).toBe(1)
    const restored = await db.contacts.toArray()
    expect(restored[0].firstName).toBe('Restored')
  })

  it('merge=false clears existing data before restore', async () => {
    // Pre-existing contact
    await seedContact({ id: 'existing', firstName: 'Old', lastName: 'Data' })

    // Backup payload with a different contact
    const payload = {
      version: '1.0',
      appName: 'MiNet CRM',
      exportedAt: new Date().toISOString(),
      data: {
        contacts: [{
          id: 'new-c',
          firstName: 'New',
          lastName: 'Contact',
          tier: 'B',
          relationshipType: 'customer',
          tags: [],
          customFields: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        companies: [],
        interactions: [],
        events: [],
        reminders: [],
        tags: [],
        customFieldDefs: [],
      },
    }

    const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' })
    await restoreFromLocalFile(file, false) // merge=false

    const contacts = await db.contacts.toArray()
    expect(contacts).toHaveLength(1)
    expect(contacts[0].id).toBe('new-c') // Old data gone
  })

  it('merge=true adds data without clearing existing contacts', async () => {
    await seedContact({ id: 'existing', firstName: 'Old', lastName: 'Data' })

    const payload = {
      version: '1.0',
      appName: 'MiNet CRM',
      exportedAt: new Date().toISOString(),
      data: {
        contacts: [{
          id: 'merged-c',
          firstName: 'Merged',
          lastName: 'Contact',
          tier: 'A',
          relationshipType: 'partner',
          tags: [],
          customFields: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }],
        companies: [],
        interactions: [],
        events: [],
        reminders: [],
        tags: [],
        customFieldDefs: [],
      },
    }

    const file = new File([JSON.stringify(payload)], 'backup.json', { type: 'application/json' })
    await restoreFromLocalFile(file, true) // merge=true

    const contacts = await db.contacts.toArray()
    expect(contacts.length).toBeGreaterThanOrEqual(2)
  })
})
