import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { CustomFieldDef, CustomFieldCategory, CustomFieldType } from '@/types'
import { generateId, now as nowStr } from '@/lib/utils'

export function useCustomFieldDefs() {
  const defs = useLiveQuery(() => db.customFieldDefs.orderBy('order').toArray())
  return defs ?? []
}

export async function createCustomFieldDef(data: {
  name: string
  type: CustomFieldType
  category: CustomFieldCategory
  isRequired: boolean
  placeholder?: string
  icon?: string
}): Promise<CustomFieldDef> {
  const all = await db.customFieldDefs.toArray()
  const maxOrder = all.length > 0 ? Math.max(...all.map(d => d.order)) : -1
  const def: CustomFieldDef = {
    ...data,
    id: generateId(),
    order: maxOrder + 1,
  }
  await db.customFieldDefs.add(def)
  return def
}

export async function updateCustomFieldDef(id: string, data: Partial<CustomFieldDef>): Promise<void> {
  await db.customFieldDefs.update(id, data)
}

export async function deleteCustomFieldDef(id: string, deleteData: boolean): Promise<void> {
  await db.customFieldDefs.delete(id)
  if (deleteData) {
    // Remove all contact values for this field
    const contacts = await db.contacts.toArray()
    for (const contact of contacts) {
      if (id in contact.customFields) {
        const updated = { ...contact.customFields }
        delete updated[id]
        await db.contacts.update(contact.id, { customFields: updated, updatedAt: nowStr() })
      }
    }
  }
}

export async function reorderCustomFieldDefs(ids: string[]): Promise<void> {
  await db.transaction('rw', db.customFieldDefs, async () => {
    for (let i = 0; i < ids.length; i++) {
      await db.customFieldDefs.update(ids[i], { order: i })
    }
  })
}
