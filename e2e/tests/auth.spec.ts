import { test, expect } from '@playwright/test'

test.describe('Authentication — First time user', () => {
  test.beforeEach(async ({ page }) => {
    // Clear all IndexedDB data so we start fresh
    await page.goto('/')
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('MiNetCRM')
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
      })
    })
    await page.reload()
  })

  test('redirects to /login on first visit', async ({ page }) => {
    await expect(page).toHaveURL('/login')
    await expect(page.getByText('MiNet CRM')).toBeVisible()
  })

  test('can enter name and start using the app without Google', async ({ page }) => {
    await page.goto('/login')

    // Look for "continue without login" option
    const continueBtn = page.getByRole('button', { name: /Tiếp tục|không đăng nhập/i })
    if (await continueBtn.isVisible()) {
      await continueBtn.click()
    }

    // Fill in display name if prompted
    const nameInput = page.getByLabel(/Tên hiển thị/i)
    if (await nameInput.isVisible()) {
      await nameInput.fill('Nguyễn Test')
      await page.getByRole('button', { name: /Bắt đầu|Tiếp tục/i }).click()
    }

    // Should reach dashboard or home
    await expect(page).toHaveURL('/')
  })
})

test.describe('Authentication — Returning user', () => {
  test('shows PIN lock screen when PIN is enabled', async ({ page }) => {
    await page.goto('/lock')
    await expect(page.getByText('Nhập mã PIN để mở khóa')).toBeVisible()
  })

  test('PIN numpad has all 10 digit buttons', async ({ page }) => {
    await page.goto('/lock')
    for (const digit of ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']) {
      await expect(page.getByRole('button', { name: digit })).toBeVisible()
    }
  })
})
