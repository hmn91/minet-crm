import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import {
  useEvents,
  useEvent,
  useUpcomingEvents,
  useContactEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from '@/hooks/useEvents'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'
import type { Event } from '@/types'

function makeEventData(overrides?: Partial<Omit<Event, 'id' | 'createdAt' | 'updatedAt'>>) {
  return {
    title: 'Test Event',
    date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    contactIds: [],
    ...overrides,
  }
}

beforeEach(async () => {
  await resetDb()
})

// ============================================================
// createEvent
// ============================================================
describe('createEvent', () => {
  it('creates an event with generated id and timestamps', async () => {
    const event = await createEvent(makeEventData())
    expect(event.id).toBeDefined()
    expect(event.id.length).toBeGreaterThan(0)
    expect(event.createdAt).toBeDefined()
    expect(event.updatedAt).toBeDefined()
    const inDb = await db.events.get(event.id)
    expect(inDb).toBeDefined()
  })

  // EVT-11: Tạo event 0 participants (không bắt buộc)
  it('creates event with 0 participants (contactIds empty)', async () => {
    const event = await createEvent(makeEventData({ contactIds: [] }))
    expect(event.contactIds).toEqual([])
    const inDb = await db.events.get(event.id)
    expect(inDb?.contactIds).toHaveLength(0)
  })

  it('creates event with multiple participants', async () => {
    const c1 = await seedContact({ firstName: 'Alice' })
    const c2 = await seedContact({ firstName: 'Bob' })
    const event = await createEvent(makeEventData({ contactIds: [c1.id, c2.id] }))
    expect(event.contactIds).toContain(c1.id)
    expect(event.contactIds).toContain(c2.id)
  })

  it('creates event with outcome and nextSteps', async () => {
    const event = await createEvent(makeEventData({
      outcome: 'Ký hợp đồng',
      nextSteps: 'Gửi hóa đơn',
      followUpDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    }))
    expect(event.outcome).toBe('Ký hợp đồng')
    expect(event.nextSteps).toBe('Gửi hóa đơn')
    expect(event.followUpDate).toBeDefined()
  })
})

// ============================================================
// updateEvent
// ============================================================
describe('updateEvent', () => {
  it('updates title and bumps updatedAt', async () => {
    const event = await createEvent(makeEventData({ title: 'Old Title' }))
    await new Promise(r => setTimeout(r, 10))
    await updateEvent(event.id, { title: 'New Title' })
    const updated = await db.events.get(event.id)
    expect(updated?.title).toBe('New Title')
    expect(updated?.updatedAt).not.toBe(event.updatedAt)
  })

  it('adds outcome to existing event (past event flow)', async () => {
    const pastDate = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
    const event = await createEvent(makeEventData({ date: pastDate }))
    await updateEvent(event.id, { outcome: 'Thành công', nextSteps: 'Follow up tuần sau' })
    const updated = await db.events.get(event.id)
    expect(updated?.outcome).toBe('Thành công')
    expect(updated?.nextSteps).toBe('Follow up tuần sau')
  })
})

// ============================================================
// deleteEvent
// ============================================================
describe('deleteEvent', () => {
  it('removes the event from DB', async () => {
    const event = await createEvent(makeEventData())
    await deleteEvent(event.id)
    expect(await db.events.get(event.id)).toBeUndefined()
  })

  it('does NOT cascade delete contacts when event is deleted', async () => {
    const contact = await seedContact({ firstName: 'Participant' })
    const event = await createEvent(makeEventData({ contactIds: [contact.id] }))
    await deleteEvent(event.id)
    // Contact should still exist
    expect(await db.contacts.get(contact.id)).toBeDefined()
  })
})

// ============================================================
// useEvents
// ============================================================
describe('useEvents', () => {
  it('returns empty array when no events', async () => {
    const { result } = renderHook(() => useEvents())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('returns all events sorted by date descending (newest first)', async () => {
    const olderDate = '2024-01-01'
    const newerDate = '2024-06-01'
    await createEvent(makeEventData({ title: 'Older', date: olderDate }))
    await createEvent(makeEventData({ title: 'Newer', date: newerDate }))
    const { result } = renderHook(() => useEvents())
    await waitFor(() => {
      expect(result.current.length).toBe(2)
      expect(result.current[0].title).toBe('Newer') // newest first
      expect(result.current[1].title).toBe('Older')
    })
  })
})

// ============================================================
// useEvent - single query
// ============================================================
describe('useEvent', () => {
  it('returns undefined for non-existent id', async () => {
    const { result } = renderHook(() => useEvent('non-existent'))
    await waitFor(() => {
      expect(result.current).toBeUndefined()
    })
  })

  it('returns the correct event by id', async () => {
    const event = await createEvent(makeEventData({ title: 'Found Event' }))
    const { result } = renderHook(() => useEvent(event.id))
    await waitFor(() => {
      expect(result.current?.title).toBe('Found Event')
    })
  })
})

// ============================================================
// useUpcomingEvents — EVT-02: Event boundary (today = upcoming)
// SEC-14: Event hôm nay thuộc về "Sắp tới" hay "Đã qua"?
// ============================================================
describe('useUpcomingEvents', () => {
  it('returns events with date >= today (today is "upcoming")', async () => {
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)

    await createEvent(makeEventData({ title: 'Past', date: yesterday }))
    await createEvent(makeEventData({ title: 'Today', date: today }))
    await createEvent(makeEventData({ title: 'Future', date: tomorrow }))

    const { result } = renderHook(() => useUpcomingEvents(10))
    await waitFor(() => {
      const titles = result.current.map(e => e.title)
      expect(titles).toContain('Today')   // SEC-14: today = upcoming ✓
      expect(titles).toContain('Future')
      expect(titles).not.toContain('Past') // past không xuất hiện ✓
    })
  })

  it('respects the limit parameter', async () => {
    const today = new Date().toISOString().slice(0, 10)
    await createEvent(makeEventData({ title: 'E1', date: today }))
    await createEvent(makeEventData({ title: 'E2', date: today }))
    await createEvent(makeEventData({ title: 'E3', date: today }))

    const { result } = renderHook(() => useUpcomingEvents(2))
    await waitFor(() => {
      expect(result.current.length).toBe(2)
    })
  })

  it('returns empty array when no upcoming events', async () => {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    await createEvent(makeEventData({ title: 'Past Event', date: yesterday }))

    const { result } = renderHook(() => useUpcomingEvents(5))
    await waitFor(() => {
      expect(result.current.length).toBe(0)
    })
  })

  // DASH-12: Events đã qua KHÔNG xuất hiện trong upcoming
  it('does not include past events in upcoming', async () => {
    const last7days = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)
    await createEvent(makeEventData({ title: 'Week Ago', date: last7days }))

    const { result } = renderHook(() => useUpcomingEvents(5))
    await waitFor(() => {
      expect(result.current.length).toBe(0)
    })
  })
})

// ============================================================
// useContactEvents
// ============================================================
describe('useContactEvents', () => {
  it('returns only events where contact is a participant', async () => {
    const c1 = await seedContact({ firstName: 'Participant' })
    const c2 = await seedContact({ firstName: 'Other' })

    await createEvent(makeEventData({ title: 'C1 Event', contactIds: [c1.id] }))
    await createEvent(makeEventData({ title: 'C2 Event', contactIds: [c2.id] }))
    await createEvent(makeEventData({ title: 'Both Event', contactIds: [c1.id, c2.id] }))

    const { result } = renderHook(() => useContactEvents(c1.id))
    await waitFor(() => {
      const titles = result.current.map(e => e.title)
      expect(titles).toContain('C1 Event')
      expect(titles).toContain('Both Event')
      expect(titles).not.toContain('C2 Event')
    })
  })

  it('returns empty array when contact has no events', async () => {
    const contact = await seedContact()
    const { result } = renderHook(() => useContactEvents(contact.id))
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })
})
