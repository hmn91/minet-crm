import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import {
  useReminders,
  useDueReminders,
  useUpcomingReminders,
  createReminder,
  completeReminder,
  deleteReminder,
} from '@/hooks/useReminders'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('createReminder', () => {
  it('creates a reminder with isCompleted=false', async () => {
    const contact = await seedContact()
    const reminder = await createReminder({
      contactId: contact.id,
      title: 'Follow up',
      dueDate: new Date().toISOString(),
    })
    expect(reminder.isCompleted).toBe(false)
    expect(reminder.id.length).toBeGreaterThan(0)
  })
})

describe('completeReminder', () => {
  it('marks reminder as completed and sets completedAt', async () => {
    const contact = await seedContact()
    const reminder = await createReminder({
      contactId: contact.id,
      title: 'Follow up',
      dueDate: new Date().toISOString(),
    })
    await completeReminder(reminder.id)
    const updated = await db.reminders.get(reminder.id)
    expect(updated?.isCompleted).toBe(true)
    expect(updated?.completedAt).toBeDefined()
  })
})

describe('deleteReminder', () => {
  it('removes the reminder from DB', async () => {
    const contact = await seedContact()
    const reminder = await createReminder({
      contactId: contact.id,
      title: 'To delete',
      dueDate: new Date().toISOString(),
    })
    await deleteReminder(reminder.id)
    expect(await db.reminders.get(reminder.id)).toBeUndefined()
  })
})

describe('useDueReminders', () => {
  it('returns empty array when no reminders', async () => {
    const { result } = renderHook(() => useDueReminders())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('returns only past incomplete reminders', async () => {
    const contact = await seedContact()
    const pastDate = new Date(Date.now() - 86400000).toISOString() // yesterday
    const futureDate = new Date(Date.now() + 86400000).toISOString() // tomorrow

    // Past, incomplete — should be included
    await db.reminders.add({
      id: 'r1',
      contactId: contact.id,
      title: 'Due',
      dueDate: pastDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    })
    // Future, incomplete — NOT due yet
    await db.reminders.add({
      id: 'r2',
      contactId: contact.id,
      title: 'Future',
      dueDate: futureDate,
      isCompleted: false,
      createdAt: new Date().toISOString(),
    })
    // Past, completed — NOT due
    await db.reminders.add({
      id: 'r3',
      contactId: contact.id,
      title: 'Completed',
      dueDate: pastDate,
      isCompleted: true,
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    })

    const { result } = renderHook(() => useDueReminders())
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].id).toBe('r1')
    })
  })
})

describe('useReminders', () => {
  it('returns only incomplete reminders when no contactId filter', async () => {
    const contact = await seedContact()
    await createReminder({ contactId: contact.id, title: 'Active', dueDate: new Date().toISOString() })
    const completedReminder = await createReminder({
      contactId: contact.id,
      title: 'Completed',
      dueDate: new Date().toISOString(),
    })
    await completeReminder(completedReminder.id)

    const { result } = renderHook(() => useReminders())
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].title).toBe('Active')
    })
  })

  it('filters by contactId and returns only incomplete', async () => {
    const c1 = await seedContact({ firstName: 'C1' })
    const c2 = await seedContact({ firstName: 'C2' })
    await createReminder({ contactId: c1.id, title: 'C1 reminder', dueDate: new Date().toISOString() })
    await createReminder({ contactId: c2.id, title: 'C2 reminder', dueDate: new Date().toISOString() })

    const { result } = renderHook(() => useReminders(c1.id))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].contactId).toBe(c1.id)
    })
  })
})

describe('useUpcomingReminders', () => {
  it('returns only reminders within the next N days', async () => {
    const contact = await seedContact()
    const tomorrow = new Date(Date.now() + 86400000).toISOString()
    const in10Days = new Date(Date.now() + 10 * 86400000).toISOString()
    const in30Days = new Date(Date.now() + 30 * 86400000).toISOString()

    await createReminder({ contactId: contact.id, title: 'Tomorrow', dueDate: tomorrow })
    await createReminder({ contactId: contact.id, title: 'In 10 days', dueDate: in10Days })
    await createReminder({ contactId: contact.id, title: 'In 30 days', dueDate: in30Days })

    const { result } = renderHook(() => useUpcomingReminders(14))
    await waitFor(() => {
      expect(result.current.length).toBe(2) // tomorrow + in10days
    })
  })
})
