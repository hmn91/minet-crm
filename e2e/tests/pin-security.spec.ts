import { test, expect } from '@playwright/test'

test.describe('PIN Lock Page — UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lock')
  })

  test('renders the PIN lock screen with numpad', async ({ page }) => {
    await expect(page.getByText('Nhập mã PIN để mở khóa')).toBeVisible()
    for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']) {
      await expect(page.getByRole('button', { name: d })).toBeVisible()
    }
  })

  test('PIN dot indicator fills as digits are entered', async ({ page }) => {
    // Click 3 digits
    await page.getByRole('button', { name: '1' }).click()
    await page.getByRole('button', { name: '2' }).click()
    await page.getByRole('button', { name: '3' }).click()
    // The filled dots should have the "bg-primary" class
    const filledDots = page.locator('.bg-primary.border-primary')
    await expect(filledDots).toHaveCount(3)
  })

  test('delete button removes last digit', async ({ page }) => {
    await page.getByRole('button', { name: '1' }).click()
    await page.getByRole('button', { name: '2' }).click()
    // Delete one digit
    const deleteBtn = page.locator('button').filter({ hasText: '' }).last()
    // Use the SVG delete button (lucide-delete)
    const svgBtn = page.locator('button:has(.lucide-delete)')
    await svgBtn.click()
    // Should now have 1 filled dot
    const filledDots = page.locator('.bg-primary.border-primary')
    await expect(filledDots).toHaveCount(1)
  })
})
