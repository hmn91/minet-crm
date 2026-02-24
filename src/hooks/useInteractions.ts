import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Interaction, InteractionType } from '@/types'
import { generateId, now } from '@/lib/utils'

export function useInteractions(contactId?: string) {
  const interactions = useLiveQuery(async () => {
    if (contactId) {
      return db.interactions.where('contactId').equals(contactId).reverse().sortBy('date')
    }
    return db.interactions.orderBy('date').reverse().toArray()
  }, [contactId])
  return interactions ?? []
}

export function useRecentInteractions(limit = 10) {
  const interactions = useLiveQuery(async () => {
    return db.interactions.orderBy('date').reverse().limit(limit).toArray()
  }, [limit])
  return interactions ?? []
}

export async function createInteraction(data: {
  contactId: string
  type: InteractionType
  date: string
  notes?: string
  outcome?: string
}): Promise<Interaction> {
  const interaction: Interaction = {
    ...data,
    id: generateId(),
    createdAt: now(),
  }
  await db.transaction('rw', [db.interactions, db.contacts], async () => {
    await db.interactions.add(interaction)
    await db.contacts.update(data.contactId, {
      lastContactedAt: data.date,
      updatedAt: now(),
    })
  })
  return interaction
}

export async function deleteInteraction(id: string): Promise<void> {
  await db.interactions.delete(id)
}
