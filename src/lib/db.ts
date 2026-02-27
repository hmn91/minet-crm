import Dexie, { type EntityTable } from 'dexie'
import type {
  Contact,
  Company,
  Interaction,
  Event,
  Reminder,
  Tag,
  CustomFieldDef,
  UserProfile,
  AppSettings,
} from '@/types'

// ============================================================
// MiNet CRM Database
// ============================================================

interface AppSettingsRecord {
  key: string
  value: unknown
}

class MiNetDB extends Dexie {
  contacts!: EntityTable<Contact, 'id'>
  companies!: EntityTable<Company, 'id'>
  interactions!: EntityTable<Interaction, 'id'>
  events!: EntityTable<Event, 'id'>
  reminders!: EntityTable<Reminder, 'id'>
  tags!: EntityTable<Tag, 'id'>
  customFieldDefs!: EntityTable<CustomFieldDef, 'id'>
  userProfile!: EntityTable<UserProfile, 'id'>
  appSettings!: EntityTable<AppSettingsRecord, 'key'>

  constructor() {
    super('MiNetCRM')

    this.version(1).stores({
      contacts: '&id, firstName, lastName, email, companyId, tier, *tags, lastContactedAt, nextFollowUpAt, createdAt',
      companies: '&id, name, industry, createdAt',
      interactions: '&id, contactId, type, date, createdAt',
      events: '&id, title, date, *contactIds, createdAt',
      reminders: '&id, contactId, dueDate, isCompleted, createdAt',
      tags: '&id, name, createdAt',
      customFieldDefs: '&id, name, category, order',
      userProfile: '&id',
      appSettings: '&key',
    })
  }
}

export const db = new MiNetDB()

// ============================================================
// Settings helpers
// ============================================================

export async function getSetting<K extends keyof AppSettings>(key: K): Promise<AppSettings[K] | undefined> {
  const record = await db.appSettings.get(key)
  return record?.value as AppSettings[K] | undefined
}

export async function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]): Promise<void> {
  await db.appSettings.put({ key, value })
}

export async function getAllSettings(): Promise<Partial<AppSettings>> {
  const records = await db.appSettings.toArray()
  const settings: Partial<AppSettings> = {}
  for (const record of records) {
    ;(settings as Record<string, unknown>)[record.key] = record.value
  }
  return settings
}

export async function saveAllSettings(settings: Partial<AppSettings>): Promise<void> {
  const records = Object.entries(settings).map(([key, value]) => ({ key, value }))
  await db.appSettings.bulkPut(records)
}

// ============================================================
// Profile helpers
// ============================================================

export async function getUserProfile(): Promise<UserProfile | undefined> {
  return db.userProfile.get('current-user')
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await db.userProfile.put(profile)
}

export async function deleteUserProfile(): Promise<void> {
  await db.userProfile.delete('current-user')
}

// ============================================================
// Backup / Restore helpers
// ============================================================

export async function exportAllData() {
  const [contacts, companies, interactions, events, reminders, tags, customFieldDefs] =
    await Promise.all([
      db.contacts.toArray(),
      db.companies.toArray(),
      db.interactions.toArray(),
      db.events.toArray(),
      db.reminders.toArray(),
      db.tags.toArray(),
      db.customFieldDefs.toArray(),
    ])

  return { contacts, companies, interactions, events, reminders, tags, customFieldDefs }
}

export async function importAllData(data: Awaited<ReturnType<typeof exportAllData>>) {
  await db.transaction(
    'rw',
    [db.contacts, db.companies, db.interactions, db.events, db.reminders, db.tags, db.customFieldDefs],
    async () => {
      await db.contacts.bulkPut(data.contacts)
      await db.companies.bulkPut(data.companies)
      await db.interactions.bulkPut(data.interactions)
      await db.events.bulkPut(data.events)
      await db.reminders.bulkPut(data.reminders)
      await db.tags.bulkPut(data.tags)
      await db.customFieldDefs.bulkPut(data.customFieldDefs)
    }
  )
}

export async function clearCRMData() {
  await db.transaction(
    'rw',
    [db.contacts, db.companies, db.interactions, db.events, db.reminders, db.tags, db.customFieldDefs],
    async () => {
      await Promise.all([
        db.contacts.clear(),
        db.companies.clear(),
        db.interactions.clear(),
        db.events.clear(),
        db.reminders.clear(),
        db.tags.clear(),
        db.customFieldDefs.clear(),
      ])
    }
  )
}

export async function hasCRMData(): Promise<boolean> {
  const counts = await Promise.all([
    db.contacts.count(),
    db.events.count(),
    db.reminders.count(),
    db.interactions.count(),
  ])
  return counts.some(c => c > 0)
}

export async function clearCRMData() {
  await db.transaction(
    'rw',
    [db.contacts, db.companies, db.interactions, db.events, db.reminders, db.tags, db.customFieldDefs],
    async () => {
      await Promise.all([
        db.contacts.clear(),
        db.companies.clear(),
        db.interactions.clear(),
        db.events.clear(),
        db.reminders.clear(),
        db.tags.clear(),
        db.customFieldDefs.clear(),
      ])
    }
  )
}

export async function clearAllData() {
  await db.transaction(
    'rw',
    [db.contacts, db.companies, db.interactions, db.events, db.reminders, db.tags, db.customFieldDefs, db.userProfile, db.appSettings],
    async () => {
      await Promise.all([
        db.contacts.clear(),
        db.companies.clear(),
        db.interactions.clear(),
        db.events.clear(),
        db.reminders.clear(),
        db.tags.clear(),
        db.customFieldDefs.clear(),
        db.userProfile.clear(),
        db.appSettings.clear(),
      ])
    }
  )
}
