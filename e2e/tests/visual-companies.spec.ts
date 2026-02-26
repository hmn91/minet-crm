import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'
import { seedContacts, seedCompanies, reloadAuthenticated, spaNavigate } from '../fixtures/seed-data'

/**
 * Visual E2E: COMP-01-12, COMP-14
 */

const yesterday = new Date(Date.now() - 86400000).toISOString()

test.describe('Companies — List Page', () => {
  test('COMP-01: empty state shows "Chưa có công ty nào"', async ({ page }) => {
    await setupAuth(page, '/companies')
    await expect(page.getByText('Chưa có công ty nào')).toBeVisible()
  })

  test('COMP-02: company card shows name, industry, and contact count', async ({ page }) => {
    await setupAuth(page, '/')

    await seedCompanies(page, [
      { id: 'comp1', name: 'Acme Corp', industry: 'Công nghệ', createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedContacts(page, [
      { id: 'c1', firstName: 'Anh', lastName: 'Nguyễn', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, companyId: 'comp1', createdAt: yesterday, updatedAt: yesterday },
      { id: 'c2', firstName: 'Bình', lastName: 'Trần', tier: 'B', relationshipType: 'partner', tags: [], customFields: {}, companyId: 'comp1', createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/companies')

    await expect(page.getByText('Acme Corp')).toBeVisible()
    await expect(page.getByText('Công nghệ')).toBeVisible()
    // Contact count = 2
    await expect(page.getByText('2')).toBeVisible()
  })

  test('COMP-05: clicking "+" opens Add Company dialog', async ({ page }) => {
    await setupAuth(page, '/companies')
    // The header "Thêm" button (first one in sticky header)
    await page.getByRole('button', { name: 'Thêm', exact: true }).first().click()
    await expect(page.getByText('Thêm công ty').first()).toBeVisible()
    await expect(page.getByPlaceholder('Công ty ABC')).toBeVisible()
  })

  test('COMP-06: clicking company card navigates to company detail', async ({ page }) => {
    await setupAuth(page, '/')

    await seedCompanies(page, [
      { id: 'comp-nav', name: 'Nav Corp', createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/companies')

    await page.getByText('Nav Corp').click()
    await page.waitForURL('**/companies/comp-nav', { timeout: 6000 })
    expect(page.url()).toContain('/companies/comp-nav')
  })
})

test.describe('Companies — Form Validation', () => {
  test('COMP-07: empty company name shows validation error', async ({ page }) => {
    await setupAuth(page, '/companies')
    await page.getByRole('button', { name: 'Thêm', exact: true }).first().click()
    await expect(page.getByText('Thêm công ty').first()).toBeVisible()
    // Click submit without filling name
    await page.getByRole('button', { name: 'Thêm công ty' }).click()
    await expect(page.getByText('Vui lòng nhập tên công ty')).toBeVisible()
  })

  test('COMP-08: creating a company with full details succeeds', async ({ page }) => {
    await setupAuth(page, '/companies')
    await page.getByRole('button', { name: 'Thêm', exact: true }).first().click()
    await expect(page.getByText('Thêm công ty').first()).toBeVisible()

    await page.getByPlaceholder('Công ty ABC').fill('TechStart')
    await page.getByPlaceholder('Công nghệ, Tài chính...').fill('Phần mềm')
    await page.getByRole('button', { name: 'Thêm công ty' }).click()

    // Dialog should close after successful creation
    await page.waitForTimeout(1000)
    // Company should appear in list
    await expect(page.getByText('TechStart')).toBeVisible()
  })

  test('COMP-10: size toggle selects only one option (exclusive)', async ({ page }) => {
    await setupAuth(page, '/companies')
    await page.getByRole('button', { name: 'Thêm', exact: true }).first().click()
    await expect(page.getByText('Thêm công ty').first()).toBeVisible()

    // Click "1-10" then "11-50" → only "11-50" should be selected
    const small = page.getByRole('button', { name: '1-10' })
    const medium = page.getByRole('button', { name: '11-50' })

    await small.click()
    await expect(small).toHaveClass(/bg-primary/)

    await medium.click()
    await expect(medium).toHaveClass(/bg-primary/)
    // Small should no longer be primary
    await expect(small).not.toHaveClass(/bg-primary/)
  })
})

test.describe('Companies — Detail Page', () => {
  test('COMP-11: edit company dialog pre-fills existing data', async ({ page }) => {
    await setupAuth(page, '/')

    await seedCompanies(page, [
      { id: 'comp-edit', name: 'EditMe Corp', industry: 'Tài chính', createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/companies/comp-edit')

    // Click edit button (pencil/Edit2 icon) — first icon button in header
    const editBtn = page.locator('button[class*="hover:bg-accent"]').first()
    await editBtn.click()

    await expect(page.getByPlaceholder('Công ty ABC')).toHaveValue('EditMe Corp')
    await expect(page.getByPlaceholder('Công nghệ, Tài chính...')).toHaveValue('Tài chính')
  })

  test('COMP-12: company detail shows linked contacts', async ({ page }) => {
    await setupAuth(page, '/')

    await seedCompanies(page, [
      { id: 'comp-detail', name: 'Detail Corp', createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedContacts(page, [
      { id: 'c-linked', firstName: 'Linked', lastName: 'Contact', tier: 'B', relationshipType: 'customer', tags: [], customFields: {}, companyId: 'comp-detail', createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/companies/comp-detail')

    // CompaniesPage shows contacts as "lastName firstName" (see CompaniesPage line 240)
    await expect(page.getByText('Contact Linked')).toBeVisible({ timeout: 10000 })
    // "LIÊN HỆ (1)" header
    await expect(page.getByText(/LIÊN HỆ \(1\)/)).toBeVisible()
  })

  test('COMP-14: clicking linked contact navigates to contact detail', async ({ page }) => {
    await setupAuth(page, '/')

    await seedCompanies(page, [
      { id: 'comp-nav2', name: 'NavComp', createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedContacts(page, [
      { id: 'c-nav-company', firstName: 'NavTo', lastName: 'Contact', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, companyId: 'comp-nav2', createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/companies/comp-nav2')

    // CompaniesPage shows contacts as "lastName firstName" — wait for live query first
    await expect(page.getByText('Contact NavTo')).toBeVisible({ timeout: 10000 })
    await page.getByText('Contact NavTo').click()
    await page.waitForURL('**/contacts/c-nav-company', { timeout: 6000 })
    expect(page.url()).toContain('/contacts/c-nav-company')
  })
})
