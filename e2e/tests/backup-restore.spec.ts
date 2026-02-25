import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'

test.describe('Backup & Restore — Settings page', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, '/settings')
  })

  test('settings page is accessible', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Cài đặt/i })).toBeVisible()
  })

  test('backup section is visible', async ({ page }) => {
    await expect(page.getByText(/Sao lưu|Backup/i).first()).toBeVisible()
  })

  test('local backup button is visible', async ({ page }) => {
    const backupBtn = page.getByRole('button', { name: /Lưu file|Tải xuống/i })
    await expect(backupBtn).toBeVisible()
  })
})
