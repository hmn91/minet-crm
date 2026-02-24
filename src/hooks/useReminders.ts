import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Reminder } from '@/types'
import { generateId, now } from '@/lib/utils'

export function useReminders(contactId?: string) {
  const reminders = useLiveQuery(async () => {
    if (contactId) {
      return db.reminders
        .where('contactId')
        .equals(contactId)
        .and(r => !r.isCompleted)
        .sortBy('dueDate')
    }
    return db.reminders.where('isCompleted').equals(0).sortBy('dueDate')
  }, [contactId])
  return reminders ?? []
}

export function useDueReminders() {
  const reminders = useLiveQuery(async () => {
    const now = new Date().toISOString()
    const all = await db.reminders
      .where('isCompleted')
      .equals(0)
      .and(r => r.dueDate <= now)
      .sortBy('dueDate')
    return all
  })
  return reminders ?? []
}

export function useUpcomingReminders(days = 7) {
  const reminders = useLiveQuery(async () => {
    const today = new Date()
    const future = new Date(today)
    future.setDate(future.getDate() + days)
    const all = await db.reminders
      .where('isCompleted')
      .equals(0)
      .and(r => r.dueDate >= today.toISOString() && r.dueDate <= future.toISOString())
      .sortBy('dueDate')
    return all
  }, [days])
  return reminders ?? []
}

export async function createReminder(data: {
  contactId: string
  title: string
  dueDate: string
  notes?: string
}): Promise<Reminder> {
  const reminder: Reminder = {
    ...data,
    id: generateId(),
    isCompleted: false,
    createdAt: now(),
  }
  await db.reminders.add(reminder)
  return reminder
}

export async function completeReminder(id: string): Promise<void> {
  await db.reminders.update(id, { isCompleted: true, completedAt: now() })
}

export async function deleteReminder(id: string): Promise<void> {
  await db.reminders.delete(id)
}
