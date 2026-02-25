import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import {
  useInteractions,
  useRecentInteractions,
  createInteraction,
  deleteInteraction,
} from '@/hooks/useInteractions'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('createInteraction', () => {
  it('adds an interaction and returns it with generated id', async () => {
    const contact = await seedContact()
    const interaction = await createInteraction({
      contactId: contact.id,
      type: 'call',
      date: new Date().toISOString(),
    })
    expect(interaction.id.length).toBeGreaterThan(0)
    expect(interaction.type).toBe('call')
    const inDb = await db.interactions.get(interaction.id)
    expect(inDb).toBeDefined()
  })

  it('updates contact.lastContactedAt with the interaction date', async () => {
    const contact = await seedContact()
    expect(contact.lastContactedAt).toBeUndefined()

    const interactionDate = '2026-02-20T10:00:00.000Z'
    await createInteraction({
      contactId: contact.id,
      type: 'meeting',
      date: interactionDate,
    })

    const updated = await db.contacts.get(contact.id)
    expect(updated?.lastContactedAt).toBe(interactionDate)
  })

  it('saves optional notes and outcome', async () => {
    const contact = await seedContact()
    const interaction = await createInteraction({
      contactId: contact.id,
      type: 'email',
      date: new Date().toISOString(),
      notes: 'Discussed Q1 goals',
      outcome: 'Positive',
    })
    expect(interaction.notes).toBe('Discussed Q1 goals')
    expect(interaction.outcome).toBe('Positive')
  })
})

describe('deleteInteraction', () => {
  it('removes the interaction from DB', async () => {
    const contact = await seedContact()
    const interaction = await createInteraction({
      contactId: contact.id,
      type: 'call',
      date: new Date().toISOString(),
    })
    await deleteInteraction(interaction.id)
    expect(await db.interactions.get(interaction.id)).toBeUndefined()
  })
})

describe('useInteractions', () => {
  it('returns all interactions (no contactId filter) sorted by date desc', async () => {
    const c1 = await seedContact({ firstName: 'C1' })
    const c2 = await seedContact({ firstName: 'C2' })
    await createInteraction({ contactId: c1.id, type: 'call', date: '2026-01-01T00:00:00.000Z' })
    await createInteraction({ contactId: c2.id, type: 'email', date: '2026-01-03T00:00:00.000Z' })
    await createInteraction({ contactId: c1.id, type: 'meeting', date: '2026-01-02T00:00:00.000Z' })

    const { result } = renderHook(() => useInteractions())
    await waitFor(() => {
      expect(result.current.length).toBe(3)
      // desc order: Jan 3, Jan 2, Jan 1
      expect(result.current[0].date).toBe('2026-01-03T00:00:00.000Z')
      expect(result.current[2].date).toBe('2026-01-01T00:00:00.000Z')
    })
  })

  it('filters by contactId', async () => {
    const c1 = await seedContact({ firstName: 'C1' })
    const c2 = await seedContact({ firstName: 'C2' })
    await createInteraction({ contactId: c1.id, type: 'call', date: new Date().toISOString() })
    await createInteraction({ contactId: c2.id, type: 'call', date: new Date().toISOString() })

    const { result } = renderHook(() => useInteractions(c1.id))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].contactId).toBe(c1.id)
    })
  })
})

describe('useRecentInteractions', () => {
  it('limits to specified count', async () => {
    const contact = await seedContact()
    for (let i = 0; i < 5; i++) {
      await createInteraction({
        contactId: contact.id,
        type: 'call',
        date: new Date(Date.now() + i * 1000).toISOString(),
      })
    }
    const { result } = renderHook(() => useRecentInteractions(3))
    await waitFor(() => {
      expect(result.current.length).toBe(3)
    })
  })
})
