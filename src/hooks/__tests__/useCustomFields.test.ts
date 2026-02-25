import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import {
  useCustomFieldDefs,
  createCustomFieldDef,
  updateCustomFieldDef,
  deleteCustomFieldDef,
  reorderCustomFieldDefs,
} from '@/hooks/useCustomFields'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('createCustomFieldDef', () => {
  it('creates a field def with correct order (next after max)', async () => {
    const def1 = await createCustomFieldDef({
      name: 'Facebook',
      type: 'url',
      category: 'social',
      isRequired: false,
    })
    expect(def1.order).toBe(0)

    const def2 = await createCustomFieldDef({
      name: 'Instagram',
      type: 'url',
      category: 'social',
      isRequired: false,
    })
    expect(def2.order).toBe(1)
  })

  it('stores all provided fields', async () => {
    const def = await createCustomFieldDef({
      name: 'Zalo',
      type: 'phone',
      category: 'social',
      isRequired: false,
      placeholder: '09...',
      icon: 'Phone',
    })
    expect(def.name).toBe('Zalo')
    expect(def.type).toBe('phone')
    expect(def.placeholder).toBe('09...')
  })
})

describe('updateCustomFieldDef', () => {
  it('updates specified fields', async () => {
    const def = await createCustomFieldDef({
      name: 'Old Name',
      type: 'text',
      category: 'other',
      isRequired: false,
    })
    await updateCustomFieldDef(def.id, { name: 'New Name' })
    const updated = await db.customFieldDefs.get(def.id)
    expect(updated?.name).toBe('New Name')
  })
})

describe('deleteCustomFieldDef', () => {
  it('removes the field def from DB', async () => {
    const def = await createCustomFieldDef({
      name: 'To Delete',
      type: 'text',
      category: 'other',
      isRequired: false,
    })
    await deleteCustomFieldDef(def.id, false)
    expect(await db.customFieldDefs.get(def.id)).toBeUndefined()
  })

  it('deleteData=true removes field from all contacts', async () => {
    const def = await createCustomFieldDef({
      name: 'Twitter',
      type: 'url',
      category: 'social',
      isRequired: false,
    })
    await seedContact({ customFields: { [def.id]: 'https://x.com/user1' } })
    await seedContact({ customFields: { [def.id]: 'https://x.com/user2' } })

    await deleteCustomFieldDef(def.id, true)

    const contacts = await db.contacts.toArray()
    for (const c of contacts) {
      expect(def.id in c.customFields).toBe(false)
    }
  })

  it('deleteData=false preserves field values on contacts', async () => {
    const def = await createCustomFieldDef({
      name: 'Facebook',
      type: 'url',
      category: 'social',
      isRequired: false,
    })
    await seedContact({ customFields: { [def.id]: 'https://fb.com/user' } })

    await deleteCustomFieldDef(def.id, false)

    const contacts = await db.contacts.toArray()
    expect(contacts[0].customFields[def.id]).toBe('https://fb.com/user')
  })
})

describe('reorderCustomFieldDefs', () => {
  it('updates order attribute according to provided id array', async () => {
    const d1 = await createCustomFieldDef({ name: 'F1', type: 'text', category: 'other', isRequired: false })
    const d2 = await createCustomFieldDef({ name: 'F2', type: 'text', category: 'other', isRequired: false })
    const d3 = await createCustomFieldDef({ name: 'F3', type: 'text', category: 'other', isRequired: false })

    // Reverse order
    await reorderCustomFieldDefs([d3.id, d2.id, d1.id])

    const all = await db.customFieldDefs.orderBy('order').toArray()
    expect(all[0].id).toBe(d3.id)
    expect(all[1].id).toBe(d2.id)
    expect(all[2].id).toBe(d1.id)
  })
})

describe('useCustomFieldDefs', () => {
  it('returns empty array when no defs', async () => {
    const { result } = renderHook(() => useCustomFieldDefs())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('returns defs ordered by order field', async () => {
    const d1 = await createCustomFieldDef({ name: 'First', type: 'text', category: 'other', isRequired: false })
    const d2 = await createCustomFieldDef({ name: 'Second', type: 'url', category: 'social', isRequired: false })
    const { result } = renderHook(() => useCustomFieldDefs())
    await waitFor(() => {
      expect(result.current.length).toBe(2)
      expect(result.current[0].id).toBe(d1.id)
      expect(result.current[1].id).toBe(d2.id)
    })
  })
})
