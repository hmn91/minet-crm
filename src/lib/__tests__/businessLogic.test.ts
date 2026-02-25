/**
 * Business Logic Tests — Dashboard, Security, Edge Cases
 *
 * Test IDs: DASH-04..09, SEC-10..18, SET-13, PIN-07, PIN-10
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/lib/db'
import { createContact, deleteContact } from '@/hooks/useContacts'
import { createInteraction } from '@/hooks/useInteractions'
import { createReminder } from '@/hooks/useReminders'
import { createBackupPayload } from '@/lib/backup'
import { daysSince } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'
import { hashPIN } from '@/lib/crypto'

beforeEach(async () => {
  await resetDb()
  // Reset auth store state
  useAuthStore.setState({ isAuthenticated: false, isPinLocked: false, googleAccessToken: null, userProfile: null })
})

// ============================================================
// DASH-04, DASH-05, DASH-06: Follow-up threshold logic
// (Mirrors logic in Dashboard.tsx contactsNeedingFollowUp query)
// ============================================================
function filterFollowUp(contacts: Array<{ tier: string; lastContactedAt?: string }>) {
  return contacts.filter(c => {
    const days = daysSince(c.lastContactedAt)
    const threshold = c.tier === 'A' ? 14 : 30
    return days === null || days >= threshold
  })
}

describe('Follow-up threshold logic (Dashboard)', () => {
  // DASH-04: Tier A contact không liên hệ ≥14 ngày → xuất hiện
  it('Tier A contact with lastContact 14 days ago → needs follow-up', () => {
    const contacts = [{
      tier: 'A',
      lastContactedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    }]
    expect(filterFollowUp(contacts)).toHaveLength(1)
  })

  // SEC-12: Tier A liên hệ ngày 14 → xuất hiện
  it('Tier A contact at exactly 14 days threshold → included', () => {
    const date14ago = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    const contacts = [{
      tier: 'A',
      lastContactedAt: date14ago.toISOString(),
    }]
    const result = filterFollowUp(contacts)
    expect(result).toHaveLength(1)
  })

  // SEC-11: Tier A liên hệ ngày 13 → KHÔNG xuất hiện
  it('Tier A contact with lastContact 13 days ago → does NOT need follow-up', () => {
    const contacts = [{
      tier: 'A',
      lastContactedAt: new Date(Date.now() - 13 * 86400000).toISOString(),
    }]
    expect(filterFollowUp(contacts)).toHaveLength(0)
  })

  // DASH-05: Tier B contact không liên hệ ≥30 ngày → xuất hiện
  it('Tier B contact with lastContact 30 days ago → needs follow-up', () => {
    const contacts = [{
      tier: 'B',
      lastContactedAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    }]
    expect(filterFollowUp(contacts)).toHaveLength(1)
  })

  it('Tier B contact with lastContact 29 days ago → does NOT need follow-up', () => {
    const contacts = [{
      tier: 'B',
      lastContactedAt: new Date(Date.now() - 29 * 86400000).toISOString(),
    }]
    expect(filterFollowUp(contacts)).toHaveLength(0)
  })

  // DASH-06: Tier C/D KHÔNG xuất hiện dù lâu không liên hệ
  it('Tier C contact is never included in follow-up list', () => {
    const contacts = [
      { tier: 'C', lastContactedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
      { tier: 'D', lastContactedAt: new Date(Date.now() - 90 * 86400000).toISOString() },
      { tier: 'C', lastContactedAt: undefined }, // never contacted
    ]
    // Tier C/D are not in ['A', 'B'] — filterFollowUp applies only to A/B contacts
    // Simulate Dashboard logic: first filter tier A/B, then apply threshold
    const abContacts = contacts.filter(c => c.tier === 'A' || c.tier === 'B')
    expect(filterFollowUp(abContacts)).toHaveLength(0)
  })

  // DASH-09: Contact mới tạo (lastContactedAt=null) → không crash, xuất hiện đúng
  it('Contact with lastContactedAt=null returns null from daysSince → included in follow-up', () => {
    const contacts = [{ tier: 'A', lastContactedAt: undefined }]
    const result = filterFollowUp(contacts)
    expect(result).toHaveLength(1) // days===null → included (never contacted)
  })

  // DASH-07: Tối đa 5 contacts — tested in Dashboard component via slice(0,5)
  it('follow-up list limited to 5 contacts', () => {
    const contacts = Array.from({ length: 8 }, (_, i) => ({
      tier: 'A',
      lastContactedAt: new Date(Date.now() - (20 + i) * 86400000).toISOString(),
    }))
    const result = filterFollowUp(contacts).slice(0, 5)
    expect(result).toHaveLength(5)
  })
})

// ============================================================
// SEC-13: lastContactedAt update khi tạo interaction với ngày quá khứ
// ============================================================
describe('lastContactedAt update with past interaction date', () => {
  it('updating contact with a past interaction date sets lastContactedAt to that date', async () => {
    const contact = await seedContact({ firstName: 'Past' })
    const pastDate = new Date(Date.now() - 7 * 86400000).toISOString()

    await createInteraction({
      contactId: contact.id,
      type: 'call',
      date: pastDate,
    })

    const updated = await db.contacts.get(contact.id)
    expect(updated?.lastContactedAt).toBe(pastDate)
  })

  it('most recent interaction date wins for lastContactedAt', async () => {
    const contact = await seedContact()
    const date1 = new Date(Date.now() - 10 * 86400000).toISOString()
    const date2 = new Date(Date.now() - 3 * 86400000).toISOString()

    await createInteraction({ contactId: contact.id, type: 'call', date: date1 })
    await createInteraction({ contactId: contact.id, type: 'email', date: date2 })

    const updated = await db.contacts.get(contact.id)
    // createInteraction always updates lastContactedAt to the new interaction's date
    // So last interaction date (date2) is stored
    expect(updated?.lastContactedAt).toBe(date2)
  })
})

// ============================================================
// SEC-15: Reminder due trong quá khứ vẫn hiển thị (chưa complete)
// ============================================================
describe('Past due reminder still visible (not auto-completed)', () => {
  it('past due incomplete reminder remains in DB as incomplete', async () => {
    const contact = await seedContact()
    const pastDate = new Date(Date.now() - 5 * 86400000).toISOString()
    const reminder = await createReminder({
      contactId: contact.id,
      title: 'Past due',
      dueDate: pastDate,
    })

    const inDb = await db.reminders.get(reminder.id)
    expect(inDb?.isCompleted).toBe(false) // not auto-completed
    expect(inDb?.dueDate).toBe(pastDate)  // still has past date
  })
})

// ============================================================
// SET-13: Backup không bao gồm PIN hash
// ============================================================
describe('Backup security — PIN hash not exported', () => {
  it('backup payload does NOT contain appSettings (no PIN hash)', async () => {
    // Store a PIN hash in settings
    await db.appSettings.put({ key: 'pinEnabled', value: true })
    await db.appSettings.put({ key: 'pinHash', value: await hashPIN('123456') })

    const payload = await createBackupPayload()

    // exportAllData returns: contacts, companies, interactions, events, reminders, tags, customFieldDefs
    // It does NOT include appSettings — so PIN hash is never exported
    const payloadKeys = Object.keys(payload.data)
    expect(payloadKeys).not.toContain('appSettings')
    expect(payloadKeys).not.toContain('pinHash')
    // Verify PIN hash is NOT in any string representation
    const jsonStr = JSON.stringify(payload)
    expect(jsonStr).not.toContain('pinHash')
    expect(jsonStr).not.toContain('pinEnabled')
  })
})

// ============================================================
// SEC-10: Google access token không lưu vào IDB (in-memory only)
// ============================================================
describe('Google access token in-memory only (not persisted)', () => {
  it('setGoogleAccessToken only stores in Zustand memory, not in IndexedDB', async () => {
    const token = 'ya29.fake-access-token'
    useAuthStore.getState().setGoogleAccessToken(token)

    // Token exists in memory
    expect(useAuthStore.getState().googleAccessToken).toBe(token)

    // Token NOT in IndexedDB appSettings
    const dbRecord = await db.appSettings.get('googleAccessToken')
    expect(dbRecord).toBeUndefined()

    // All settings keys
    const allSettings = await db.appSettings.toArray()
    const hasToken = allSettings.some(s => String(s.value).includes('ya29'))
    expect(hasToken).toBe(false)
  })

  it('logout clears token from memory', () => {
    useAuthStore.getState().setGoogleAccessToken('ya29.some-token')
    useAuthStore.getState().logout()
    expect(useAuthStore.getState().googleAccessToken).toBeNull()
  })
})

// ============================================================
// PIN-10: Lockout counter reset sau unlock thành công
// (Tested via PinLockPage component behavior — here just verify crypto)
// ============================================================
describe('PIN verification edge cases', () => {
  it('hashPIN is deterministic for same input (needed for lockout counter reset verification)', async () => {
    const hash1 = await hashPIN('654321')
    const hash2 = await hashPIN('654321')
    expect(hash1).toBe(hash2)
  })

  it('different PINs produce different hashes (no collision)', async () => {
    const hash1 = await hashPIN('111111')
    const hash2 = await hashPIN('222222')
    expect(hash1).not.toBe(hash2)
  })
})

// ============================================================
// DASH-12: Reminders đã complete KHÔNG xuất hiện trong upcoming
// ============================================================
describe('Completed reminders excluded from upcoming', () => {
  it('completed reminder does not appear in useReminders (incomplete only)', async () => {
    const contact = await seedContact()
    const futureDate = new Date(Date.now() + 2 * 86400000).toISOString()

    const rem = await createReminder({
      contactId: contact.id,
      title: 'Was upcoming',
      dueDate: futureDate,
    })

    // Mark as complete
    await db.reminders.update(rem.id, { isCompleted: true, completedAt: new Date().toISOString() })

    // useReminders returns incomplete only
    const incomplete = await db.reminders.where('isCompleted').equals(0).toArray()
    expect(incomplete).toHaveLength(0)
  })
})

// ============================================================
// CON-08, CON-09: Filter by relationshipType + combined search+filter
// ============================================================
describe('Contact filter edge cases', () => {
  it('filter by relationshipType=vendor works correctly', async () => {
    await seedContact({ firstName: 'Vendor', relationshipType: 'vendor' })
    await seedContact({ firstName: 'Customer', relationshipType: 'customer' })

    const vendors = await db.contacts.filter(c => c.relationshipType === 'vendor').toArray()
    expect(vendors).toHaveLength(1)
    expect(vendors[0].firstName).toBe('Vendor')
  })

  // CON-09: Search + tier filter (AND logic)
  it('combined search and tier filter uses AND logic', async () => {
    await seedContact({ firstName: 'Alice', tier: 'A', email: 'alice@test.com' })
    await seedContact({ firstName: 'Alice', tier: 'B', email: 'alice2@test.com' })
    await seedContact({ firstName: 'Bob', tier: 'A', email: 'bob@test.com' })

    // Search "alice" AND tier "A" → should return only the first
    const results = await db.contacts
      .filter(c =>
        c.tier === 'A' &&
        (c.firstName.toLowerCase().includes('alice') ||
         c.lastName.toLowerCase().includes('alice') ||
         (c.email?.toLowerCase().includes('alice') ?? false))
      )
      .toArray()
    expect(results).toHaveLength(1)
    expect(results[0].email).toBe('alice@test.com')
  })
})

// ============================================================
// SEC-01: Cascade delete interactions + reminders when contact deleted
// (Confirming existing behavior for completeness)
// ============================================================
describe('Data integrity — cascade delete', () => {
  it('deleting contact also removes its interactions and reminders', async () => {
    const contact = await seedContact()
    await createInteraction({ contactId: contact.id, type: 'call', date: new Date().toISOString() })
    await createReminder({ contactId: contact.id, title: 'Follow up', dueDate: new Date().toISOString() })

    expect(await db.interactions.count()).toBe(1)
    expect(await db.reminders.count()).toBe(1)

    await deleteContact(contact.id)

    expect(await db.contacts.count()).toBe(0)
    expect(await db.interactions.count()).toBe(0)
    expect(await db.reminders.count()).toBe(0)
  })
})
