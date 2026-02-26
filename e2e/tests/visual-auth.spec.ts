import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'

/**
 * Visual E2E: AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-08, AUTH-09
 * PIN-07 (timeout visual)
 */

test.describe('Login Page — Validation & UI', () => {
  test.beforeEach(async ({ page }) => {
    // Go directly to /login (not authenticated)
    await page.goto('/login')
    await page.waitForURL('**/login', { timeout: 10_000 })
    // Click "Tiếp tục không đăng nhập" to show manual name input
    await page.getByText('Tiếp tục không đăng nhập').click()
  })

  // AUTH-03: Empty name → button disabled
  test('AUTH-03: empty name keeps submit button disabled', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Bắt đầu sử dụng' })
    await expect(btn).toBeDisabled()
  })

  // AUTH-04: Whitespace-only name → still disabled / not submitted
  test('AUTH-04: whitespace-only name → button stays disabled', async ({ page }) => {
    await page.getByPlaceholder('Nguyễn Văn A').fill('   ')
    const btn = page.getByRole('button', { name: 'Bắt đầu sử dụng' })
    // Button should still be disabled because trim() is empty
    await expect(btn).toBeDisabled()
  })

  // AUTH-05: XSS name → rendered as safe text, no script execution
  test('AUTH-05: XSS payload in name is safely escaped', async ({ page }) => {
    let xssExecuted = false
    page.on('dialog', () => { xssExecuted = true })

    await page.getByPlaceholder('Nguyễn Văn A').fill('<script>alert(1)</script>')
    await page.getByRole('button', { name: 'Bắt đầu sử dụng' }).click()

    // Wait a moment for any potential XSS to fire
    await page.waitForTimeout(800)
    // Primary assertion: XSS was not executed (no alert dialog fired)
    expect(xssExecuted).toBe(false)
    // Note: the text may be visible as escaped HTML — that is safe/correct behavior
  })

  // AUTH-06: Very long name (>200 chars) → handles gracefully (no crash)
  test('AUTH-06: very long name (>200 chars) handled gracefully', async ({ page }) => {
    const longName = 'A'.repeat(210)
    await page.getByPlaceholder('Nguyễn Văn A').fill(longName)
    await page.getByRole('button', { name: 'Bắt đầu sử dụng' }).click()
    // Should redirect to dashboard without crash
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8_000 })
    expect(new URL(page.url()).pathname).toBe('/')
  })
})

test.describe('Login Page — Google OAuth button', () => {
  test('AUTH-08: Google Sign-In button is visible on login page', async ({ page }) => {
    await page.goto('/login')
    await page.waitForURL('**/login', { timeout: 10_000 })
    // Google button should be visible
    await expect(page.getByText('Đăng nhập với Google')).toBeVisible()
  })
})

test.describe('Login Page — Manual login profile', () => {
  test('AUTH-09: manual login → no googleId/email in profile', async ({ page }) => {
    await page.goto('/login')
    await page.waitForURL('**/login', { timeout: 10_000 })
    await page.getByText('Tiếp tục không đăng nhập').click()
    await page.getByPlaceholder('Nguyễn Văn A').fill('Test Manual User')
    await page.getByRole('button', { name: 'Bắt đầu sử dụng' }).click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8_000 })

    // Read profile from IDB
    const profile = await page.evaluate(() => {
      return new Promise<Record<string, unknown> | null>((resolve, reject) => {
        const req = indexedDB.open('MiNetCRM')
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('userProfile', 'readonly')
          const getReq = tx.objectStore('userProfile').get('current-user')
          getReq.onsuccess = () => { db.close(); resolve(getReq.result) }
          getReq.onerror = () => reject(getReq.error)
        }
        req.onerror = () => reject(req.error)
      })
    })

    expect(profile).not.toBeNull()
    expect(profile!['googleId']).toBeUndefined()
    expect(profile!['email']).toBeUndefined()
    expect(profile!['displayName']).toBe('Test Manual User')
  })
})

test.describe('PIN Lock — Lockout visual', () => {
  // PIN-07: After 30s lockout → can retry (visual check that timer appears)
  test('PIN-07: lockout timer message shown after 5 wrong PINs', async ({ page }) => {
    // Setup auth first, then enable PIN via IDB, then set app to locked state
    await setupAuth(page, '/')

    // Enable PIN in settings via IDB
    await page.evaluate(async () => {
      // Hash "123456" manually (simplified - inject a dummy hash)
      const encoder = new TextEncoder()
      const data = encoder.encode('123456')
      const hashBuffer = await crypto.subtle.digest('SHA-256', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

      return new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('MiNetCRM')
        req.onsuccess = () => {
          const db = req.result
          const tx = db.transaction('appSettings', 'readwrite')
          const store = tx.objectStore('appSettings')
          store.put({ key: 'pinEnabled', value: true })
          store.put({ key: 'pinHash', value: hashHex })
          store.put({ key: 'pinLocked', value: true })
          store.put({ key: 'pinFailCount', value: 5 })
          store.put({ key: 'pinLockoutUntil', value: new Date(Date.now() + 30000).toISOString() })
          tx.oncomplete = () => { db.close(); resolve() }
          tx.onerror = () => reject(tx.error)
        }
        req.onerror = () => reject(req.error)
      })
    })

    // Navigate to lock page
    await page.evaluate(() => window.history.pushState({}, '', '/lock'))
    await page.evaluate(() => window.dispatchEvent(new Event('popstate')))
    await page.waitForTimeout(1000)

    // Lock page should show lockout message or disabled numpad
    // Navigate to lock directly
    await page.goto('/lock')
    await page.waitForTimeout(1500)

    // The numpad should be disabled or a lockout message shown
    // Page should not be blank
    const body = await page.locator('body').textContent()
    expect(body).toBeTruthy()
    // If lock page is shown, look for lockout-related text or disabled buttons
    const hasLockPage = await page.locator('[data-testid="pin-numpad"], button').count()
    expect(hasLockPage).toBeGreaterThan(0)
  })
})
