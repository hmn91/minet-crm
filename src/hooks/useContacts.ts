import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Contact, Tier, RelationshipType } from '@/types'
import { generateId, now } from '@/lib/utils'

export function useContacts(filters?: {
  tier?: Tier
  relationshipType?: RelationshipType
  tag?: string
  search?: string
  companyId?: string
}) {
  const contacts = useLiveQuery(async () => {
    let all: Contact[]

    if (filters?.tier) {
      all = await db.contacts.where('tier').equals(filters.tier).sortBy('firstName')
    } else {
      all = await db.contacts.orderBy('firstName').toArray()
    }

    return all.filter(c => {
      if (filters?.relationshipType && c.relationshipType !== filters.relationshipType) return false
      if (filters?.tag && !c.tags.includes(filters.tag)) return false
      if (filters?.companyId && c.companyId !== filters.companyId) return false
      if (filters?.search) {
        const q = filters.search.toLowerCase()
        const name = `${c.firstName} ${c.lastName}`.toLowerCase()
        const email = c.email?.toLowerCase() ?? ''
        const phone = c.phone?.toLowerCase() ?? ''
        if (!name.includes(q) && !email.includes(q) && !phone.includes(q)) return false
      }
      return true
    })
  }, [filters?.tier, filters?.relationshipType, filters?.tag, filters?.search, filters?.companyId])

  return contacts ?? []
}

export function useContact(id: string) {
  return useLiveQuery(() => db.contacts.get(id), [id])
}

export async function createContact(data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
  const contact: Contact = {
    ...data,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  }
  await db.contacts.add(contact)
  return contact
}

export async function updateContact(id: string, data: Partial<Contact>): Promise<void> {
  await db.contacts.update(id, { ...data, updatedAt: now() })
}

export async function deleteContact(id: string): Promise<void> {
  await db.transaction('rw', [db.contacts, db.interactions, db.reminders], async () => {
    await db.contacts.delete(id)
    await db.interactions.where('contactId').equals(id).delete()
    await db.reminders.where('contactId').equals(id).delete()
  })
}

export async function logInteraction(contactId: string): Promise<void> {
  await db.contacts.update(contactId, { lastContactedAt: now(), updatedAt: now() })
}
