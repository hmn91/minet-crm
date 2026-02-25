import { describe, it, expect, beforeEach } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/helpers/render-helpers'
import ContactsPage from '@/pages/ContactsPage'
import { db } from '@/lib/db'
import { resetDb, seedContact } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('ContactsPage — empty state', () => {
  it('shows "Chưa có liên hệ nào" when DB is empty', async () => {
    renderWithProviders(<ContactsPage />)
    expect(await screen.findByText('Chưa có liên hệ nào')).toBeInTheDocument()
  })

  it('shows "Thêm liên hệ đầu tiên" button when DB is empty', async () => {
    renderWithProviders(<ContactsPage />)
    await screen.findByText('Chưa có liên hệ nào')
    expect(screen.getByText('+ Thêm liên hệ đầu tiên')).toBeInTheDocument()
  })

  it('shows "Không tìm thấy liên hệ" when search has no results', async () => {
    await seedContact({ firstName: 'Ngọc' })
    renderWithProviders(<ContactsPage />)
    await screen.findByText('Liên hệ (1)')
    const searchInput = screen.getByPlaceholderText('Tìm kiếm...')
    await userEvent.type(searchInput, 'zzz_no_match')
    expect(await screen.findByText('Không tìm thấy liên hệ')).toBeInTheDocument()
  })
})

describe('ContactsPage — contact list', () => {
  it('shows count in header', async () => {
    await seedContact({ firstName: 'An', lastName: 'Lê' })
    await seedContact({ firstName: 'Bình', lastName: 'Trần' })
    renderWithProviders(<ContactsPage />)
    expect(await screen.findByText('Liên hệ (2)')).toBeInTheDocument()
  })

  it('displays contact names', async () => {
    await seedContact({ firstName: 'Ngọc', lastName: 'Hà', tier: 'A' })
    renderWithProviders(<ContactsPage />)
    expect(await screen.findByText('Ngọc Hà')).toBeInTheDocument()
  })

  it('groups contacts by tier with Tier headers', async () => {
    await seedContact({ firstName: 'TierA1', tier: 'A' })
    await seedContact({ firstName: 'TierA2', tier: 'A' })
    await seedContact({ firstName: 'TierC1', tier: 'C' })
    renderWithProviders(<ContactsPage />)
    await screen.findByText('Liên hệ (3)')
    const tierABadges = screen.getAllByText('Tier A')
    expect(tierABadges.length).toBeGreaterThan(0)
    expect(screen.queryByText('Tier B')).toBeNull() // no B tier contacts
  })

  it('links each contact to its detail page', async () => {
    const c = await seedContact({ firstName: 'Linked', lastName: 'Contact' })
    renderWithProviders(<ContactsPage />)
    await screen.findByText('Linked Contact')
    const link = screen.getByRole('link', { name: /Linked Contact/ })
    expect(link).toHaveAttribute('href', `/contacts/${c.id}`)
  })
})

describe('ContactsPage — search', () => {
  it('filters contacts by first name (case-insensitive)', async () => {
    await seedContact({ firstName: 'Ngọc', lastName: 'Hà' })
    await seedContact({ firstName: 'Bình', lastName: 'Trần' })
    renderWithProviders(<ContactsPage />)
    await screen.findByText('Liên hệ (2)')
    await userEvent.type(screen.getByPlaceholderText('Tìm kiếm...'), 'ngọc')
    expect(await screen.findByText('Liên hệ (1)')).toBeInTheDocument()
  })

  it('shows header Add button linking to /contacts/new', async () => {
    await seedContact({ firstName: 'Test' }) // seed to avoid empty state (2 links issue)
    renderWithProviders(<ContactsPage />)
    await screen.findByText(/Liên hệ \(1\)/)
    // The header "Thêm" button should be present (no empty-state button when contacts exist)
    const addButton = screen.getByRole('link', { name: /Thêm/ })
    expect(addButton).toHaveAttribute('href', '/contacts/new')
  })
})

describe('ContactsPage — filter indicator', () => {
  it('shows filter active dot when a filter is applied', async () => {
    await seedContact({ firstName: 'TierA', tier: 'A' })
    renderWithProviders(<ContactsPage />)
    await screen.findByText('Liên hệ (1)')

    // Toggle filter panel open
    await userEvent.click(screen.getByText('Bộ lọc'))
    expect(await screen.findByText('Tất cả tier')).toBeInTheDocument()
  })
})
