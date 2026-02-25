import { db } from '@/lib/db'
import type { Contact, Company, Interaction, Reminder } from '@/types'
import { generateId, now } from '@/lib/utils'

export async function resetDb() {
  await db.contacts.clear()
  await db.companies.clear()
  await db.interactions.clear()
  await db.events.clear()
  await db.reminders.clear()
  await db.tags.clear()
  await db.customFieldDefs.clear()
  await db.appSettings.clear()
  await db.userProfile.clear()
}

export function makeContact(overrides?: Partial<Contact>): Contact {
  return {
    id: generateId(),
    firstName: 'Test',
    lastName: 'Contact',
    tier: 'B',
    relationshipType: 'customer',
    tags: [],
    customFields: {},
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

export async function seedContact(overrides?: Partial<Contact>): Promise<Contact> {
  const contact = makeContact(overrides)
  await db.contacts.add(contact)
  return contact
}

export function makeCompany(overrides?: Partial<Company>): Company {
  return {
    id: generateId(),
    name: 'Test Company',
    createdAt: now(),
    updatedAt: now(),
    ...overrides,
  }
}

export async function seedCompany(overrides?: Partial<Company>): Promise<Company> {
  const company = makeCompany(overrides)
  await db.companies.add(company)
  return company
}

export async function seedInteraction(
  contactId: string,
  overrides?: Partial<Interaction>
): Promise<Interaction> {
  const interaction: Interaction = {
    id: generateId(),
    contactId,
    type: 'call',
    date: now(),
    createdAt: now(),
    ...overrides,
  }
  await db.interactions.add(interaction)
  return interaction
}

export async function seedReminder(
  contactId: string,
  overrides?: Partial<Reminder>
): Promise<Reminder> {
  const reminder: Reminder = {
    id: generateId(),
    contactId,
    title: 'Test Reminder',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
    isCompleted: false,
    createdAt: now(),
    ...overrides,
  }
  await db.reminders.add(reminder)
  return reminder
}
