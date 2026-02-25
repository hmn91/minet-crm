import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import {
  useContacts,
  useContact,
  createContact,
  updateContact,
  deleteContact,
} from '@/hooks/useContacts'
import { createInteraction } from '@/hooks/useInteractions'
import { createReminder } from '@/hooks/useReminders'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'
import type { Contact } from '@/types'

function makeData(overrides?: Partial<Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>>) {
  return {
    firstName: 'Test',
    lastName: 'User',
    tier: 'B' as const,
    relationshipType: 'customer' as const,
    tags: [],
    customFields: {},
    ...overrides,
  }
}

beforeEach(async () => {
  await resetDb()
})

// ============================================================
// createContact
// ============================================================
describe('createContact', () => {
  it('adds a contact and returns it with generated id, createdAt, updatedAt', async () => {
    const contact = await createContact(makeData())
    expect(contact.id).toBeDefined()
    expect(contact.id.length).toBeGreaterThan(0)
    expect(contact.createdAt).toBeDefined()
    expect(contact.updatedAt).toBeDefined()
    const inDb = await db.contacts.get(contact.id)
    expect(inDb).toBeDefined()
  })
})

// ============================================================
// updateContact
// ============================================================
describe('updateContact', () => {
  it('updates fields and bumps updatedAt', async () => {
    const contact = await createContact(makeData())
    await new Promise(r => setTimeout(r, 10)) // ensure time diff
    await updateContact(contact.id, { tier: 'A', notes: 'VIP' })
    const updated = await db.contacts.get(contact.id)
    expect(updated?.tier).toBe('A')
    expect(updated?.notes).toBe('VIP')
    expect(updated?.updatedAt).not.toBe(contact.updatedAt)
  })
})

// ============================================================
// deleteContact — cascade
// ============================================================
describe('deleteContact', () => {
  it('removes the contact from DB', async () => {
    const c = await createContact(makeData())
    await deleteContact(c.id)
    expect(await db.contacts.get(c.id)).toBeUndefined()
  })

  it('cascades: deletes related interactions', async () => {
    const c = await createContact(makeData())
    await createInteraction({ contactId: c.id, type: 'call', date: new Date().toISOString() })
    await createInteraction({ contactId: c.id, type: 'email', date: new Date().toISOString() })
    expect(await db.interactions.count()).toBe(2)
    await deleteContact(c.id)
    expect(await db.interactions.count()).toBe(0)
  })

  it('cascades: deletes related reminders', async () => {
    const c = await createContact(makeData())
    await createReminder({ contactId: c.id, title: 'Follow up', dueDate: new Date().toISOString() })
    expect(await db.reminders.count()).toBe(1)
    await deleteContact(c.id)
    expect(await db.reminders.count()).toBe(0)
  })

  it('does NOT delete interactions belonging to other contacts', async () => {
    const c1 = await createContact(makeData({ firstName: 'C1' }))
    const c2 = await createContact(makeData({ firstName: 'C2' }))
    await createInteraction({ contactId: c2.id, type: 'call', date: new Date().toISOString() })
    await deleteContact(c1.id)
    expect(await db.interactions.count()).toBe(1) // c2's interaction preserved
  })
})

// ============================================================
// useContacts reactive hook
// ============================================================
describe('useContacts', () => {
  it('returns empty array when DB is empty', async () => {
    const { result } = renderHook(() => useContacts())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('returns all contacts after seeding', async () => {
    await seedContact({ firstName: 'An', lastName: 'Lê' })
    await seedContact({ firstName: 'Bình', lastName: 'Trần' })
    const { result } = renderHook(() => useContacts())
    await waitFor(() => {
      expect(result.current.length).toBe(2)
    })
  })

  it('filters by tier', async () => {
    await seedContact({ firstName: 'TierA', tier: 'A' })
    await seedContact({ firstName: 'TierC', tier: 'C' })
    const { result } = renderHook(() => useContacts({ tier: 'A' }))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].firstName).toBe('TierA')
    })
  })

  it('filters by relationshipType', async () => {
    await seedContact({ firstName: 'Partner', relationshipType: 'partner' })
    await seedContact({ firstName: 'Customer', relationshipType: 'customer' })
    const { result } = renderHook(() => useContacts({ relationshipType: 'partner' }))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].firstName).toBe('Partner')
    })
  })

  it('search is case-insensitive and matches firstName', async () => {
    await seedContact({ firstName: 'Ngọc', lastName: 'Hà' })
    const { result } = renderHook(() => useContacts({ search: 'ngọc' }))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
    })
  })

  it('search matches email', async () => {
    await seedContact({ email: 'test@example.com' })
    const { result } = renderHook(() => useContacts({ search: 'TEST@EXAMPLE' }))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
    })
  })

  it('search matches phone', async () => {
    await seedContact({ phone: '0901234567' })
    const { result } = renderHook(() => useContacts({ search: '090' }))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
    })
  })

  it('returns no results for non-matching search', async () => {
    await seedContact({ firstName: 'Ngọc' })
    const { result } = renderHook(() => useContacts({ search: 'zzz_no_match_zzz' }))
    await waitFor(() => {
      expect(result.current.length).toBe(0)
    })
  })

  it('filters by companyId', async () => {
    await seedContact({ companyId: 'comp1', firstName: 'WithCompany' })
    await seedContact({ companyId: undefined, firstName: 'NoCompany' })
    const { result } = renderHook(() => useContacts({ companyId: 'comp1' }))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].firstName).toBe('WithCompany')
    })
  })
})

// ============================================================
// useContact — single contact reactive query
// ============================================================
describe('useContact', () => {
  it('returns undefined for non-existent id', async () => {
    const { result } = renderHook(() => useContact('non-existent'))
    await waitFor(() => {
      expect(result.current).toBeUndefined()
    })
  })

  it('returns the contact by id', async () => {
    const c = await seedContact({ firstName: 'Found' })
    const { result } = renderHook(() => useContact(c.id))
    await waitFor(() => {
      expect(result.current?.firstName).toBe('Found')
    })
  })
})
