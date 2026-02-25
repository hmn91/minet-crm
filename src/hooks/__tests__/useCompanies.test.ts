import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db } from '@/lib/db'
import {
  useCompanies,
  useCompany,
  createCompany,
  updateCompany,
  deleteCompany,
} from '@/hooks/useCompanies'
import { resetDb, seedContact, seedCompany } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('createCompany', () => {
  it('adds a company with generated id', async () => {
    const company = await createCompany({ name: 'ACME Corp' })
    expect(company.id.length).toBeGreaterThan(0)
    expect(company.name).toBe('ACME Corp')
    const inDb = await db.companies.get(company.id)
    expect(inDb).toBeDefined()
  })
})

describe('updateCompany', () => {
  it('updates company fields and bumps updatedAt', async () => {
    const company = await createCompany({ name: 'Old Name' })
    await new Promise(r => setTimeout(r, 10))
    await updateCompany(company.id, { name: 'New Name', industry: 'Tech' })
    const updated = await db.companies.get(company.id)
    expect(updated?.name).toBe('New Name')
    expect(updated?.industry).toBe('Tech')
    expect(updated?.updatedAt).not.toBe(company.updatedAt)
  })
})

describe('deleteCompany', () => {
  it('removes the company from DB', async () => {
    const company = await createCompany({ name: 'To Delete' })
    await deleteCompany(company.id)
    expect(await db.companies.get(company.id)).toBeUndefined()
  })

  it('detaches contacts — does NOT delete them', async () => {
    const company = await seedCompany({ id: 'comp1' })
    await seedContact({ companyId: company.id, firstName: 'C1' })
    await seedContact({ companyId: company.id, firstName: 'C2' })
    expect(await db.contacts.count()).toBe(2)

    await deleteCompany(company.id)

    expect(await db.contacts.count()).toBe(2) // contacts still exist
    const contacts = await db.contacts.toArray()
    for (const c of contacts) {
      expect(c.companyId).toBeUndefined() // detached
    }
  })

  it('does not affect contacts belonging to other companies', async () => {
    const c1 = await seedCompany({ id: 'comp1' })
    const c2 = await seedCompany({ id: 'comp2' })
    await seedContact({ companyId: c2.id, firstName: 'OtherCompany' })

    await deleteCompany(c1.id)

    const contacts = await db.contacts.toArray()
    expect(contacts[0].companyId).toBe(c2.id) // untouched
  })
})

describe('useCompanies', () => {
  it('returns empty array when DB is empty', async () => {
    const { result } = renderHook(() => useCompanies())
    await waitFor(() => {
      expect(result.current).toEqual([])
    })
  })

  it('returns companies ordered by name', async () => {
    await seedCompany({ name: 'Zebra Corp' })
    await seedCompany({ name: 'Alpha Inc' })
    const { result } = renderHook(() => useCompanies())
    await waitFor(() => {
      expect(result.current.length).toBe(2)
      expect(result.current[0].name).toBe('Alpha Inc')
      expect(result.current[1].name).toBe('Zebra Corp')
    })
  })

  it('search filters by name (case-insensitive)', async () => {
    await seedCompany({ name: 'MiNet Corp' })
    await seedCompany({ name: 'Other Ltd' })
    const { result } = renderHook(() => useCompanies('minet'))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].name).toBe('MiNet Corp')
    })
  })

  it('search filters by industry', async () => {
    await seedCompany({ name: 'TechCo', industry: 'Technology' })
    await seedCompany({ name: 'FoodCo', industry: 'Food' })
    const { result } = renderHook(() => useCompanies('techno'))
    await waitFor(() => {
      expect(result.current.length).toBe(1)
      expect(result.current[0].name).toBe('TechCo')
    })
  })
})

describe('useCompany', () => {
  it('returns undefined for undefined id', async () => {
    const { result } = renderHook(() => useCompany(undefined))
    await waitFor(() => {
      expect(result.current).toBeUndefined()
    })
  })

  it('returns the company by id', async () => {
    const company = await seedCompany({ name: 'Found Corp' })
    const { result } = renderHook(() => useCompany(company.id))
    await waitFor(() => {
      expect(result.current?.name).toBe('Found Corp')
    })
  })
})
