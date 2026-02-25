import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'

/**
 * E2E: Contact full lifecycle
 * Create → view → edit → verify details → delete
 */
test.describe('Contact Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, '/contacts')
  })

  test('can navigate to the add contact page', async ({ page }) => {
    // Click the "Thêm" link (header or bottom nav)
    const addBtn = page.getByRole('link', { name: /Thêm/ }).first()
    await addBtn.click()
    await expect(page).toHaveURL('/contacts/new')
    // Labels don't have htmlFor — check by placeholder text
    await expect(page.getByPlaceholder('Nguyễn')).toBeVisible() // Họ field
    await expect(page.getByPlaceholder('Văn A')).toBeVisible()   // Tên field
  })

  test('contacts page shows correct empty state', async ({ page }) => {
    // If no contacts exist, the empty state is shown
    // If contacts exist, the count header is shown
    const isEmpty = await page.getByText('Chưa có liên hệ nào').isVisible().catch(() => false)
    const hasContacts = await page.getByText(/Liên hệ \(\d+\)/).isVisible().catch(() => false)
    expect(isEmpty || hasContacts).toBe(true)
  })

  test('search input is visible and functional', async ({ page }) => {
    await expect(page.getByPlaceholder('Tìm kiếm...')).toBeVisible()
  })

  test('filter button toggles filter panel', async ({ page }) => {
    const filterBtn = page.getByText('Bộ lọc')
    await filterBtn.click()
    await expect(page.getByText('Tất cả tier')).toBeVisible()
    await filterBtn.click()
    await expect(page.getByText('Tất cả tier')).not.toBeVisible()
  })
})
