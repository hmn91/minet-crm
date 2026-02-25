import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'

test.describe('Reminders Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, '/reminders')
  })

  test('reminders page loads and shows correct structure', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Nhắc nhở/i })).toBeVisible()
  })

  test('shows empty state or reminder items', async ({ page }) => {
    // Empty state text = "Chưa có nhắc nhở nào"
    // Or there are reminder card items on the page
    const isEmpty = await page.getByText('Chưa có nhắc nhở nào').isVisible().catch(() => false)
    const hasItems = await page.locator('div[class*="card"], .rounded-lg').first().isVisible().catch(() => false)
    expect(isEmpty || hasItems).toBe(true)
  })

  test('page heading shows reminder count', async ({ page }) => {
    // Heading shows "Nhắc nhở (N)" where N >= 0
    await expect(page.getByText(/Nhắc nhở \(\d+\)/)).toBeVisible()
  })
})
