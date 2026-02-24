import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Company } from '@/types'
import { generateId, now } from '@/lib/utils'

export function useCompanies(search?: string) {
  const companies = useLiveQuery(async () => {
    const all = await db.companies.orderBy('name').toArray()
    if (!search) return all
    const q = search.toLowerCase()
    return all.filter(c => c.name.toLowerCase().includes(q) || c.industry?.toLowerCase().includes(q))
  }, [search])
  return companies ?? []
}

export function useCompany(id: string | undefined) {
  return useLiveQuery(() => (id ? db.companies.get(id) : undefined), [id])
}

export async function createCompany(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<Company> {
  const company: Company = {
    ...data,
    id: generateId(),
    createdAt: now(),
    updatedAt: now(),
  }
  await db.companies.add(company)
  return company
}

export async function updateCompany(id: string, data: Partial<Company>): Promise<void> {
  await db.companies.update(id, { ...data, updatedAt: now() })
}

export async function deleteCompany(id: string): Promise<void> {
  await db.companies.delete(id)
  // Detach contacts from this company
  const contacts = await db.contacts.where('companyId').equals(id).toArray()
  for (const c of contacts) {
    await db.contacts.update(c.id, { companyId: undefined, updatedAt: now() })
  }
}
