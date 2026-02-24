import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Event } from '@/types'
import { generateId, now } from '@/lib/utils'

export function useEvents() {
  const events = useLiveQuery(() => db.events.orderBy('date').reverse().toArray())
  return events ?? []
}

export function useEvent(id: string) {
  return useLiveQuery(() => db.events.get(id), [id])
}

export function useUpcomingEvents(limit = 5) {
  const events = useLiveQuery(async () => {
    const today = new Date().toISOString().slice(0, 10)
    const all = await db.events.where('date').aboveOrEqual(today).sortBy('date')
    return all.slice(0, limit)
  }, [limit])
  return events ?? []
}

export function useContactEvents(contactId: string) {
  const events = useLiveQuery(async () => {
    const all = await db.events.orderBy('date').reverse().toArray()
    return all.filter(e => e.contactIds.includes(contactId))
  }, [contactId])
  return events ?? []
}

export async function createEvent(data: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
  const event: Event = {
    ...data,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  }
  await db.events.add(event)
  return event
}

export async function updateEvent(id: string, data: Partial<Event>): Promise<void> {
  await db.events.update(id, { ...data, updatedAt: now() })
}

export async function deleteEvent(id: string): Promise<void> {
  await db.events.delete(id)
}
