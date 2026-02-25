import type { Page } from '@playwright/test'

/**
 * Seeds IndexedDB and navigates to an authenticated state ending at targetPath.
 *
 * Why not `page.goto(targetPath)` directly?
 *  – `page.goto()` causes a full page reload; the React app starts with
 *    `isAuthenticated=false`, immediately redirects to /login, and then
 *    GuestOnly redirects to / once AppInitializer finishes — losing the
 *    original intended URL.
 *
 * Strategy:
 *  1. goto('/') — Dexie opens and initialises the DB, then redirects to /login
 *     (isAuthenticated starts false)
 *  2. Wait for /login to confirm DB schema is ready
 *  3. Write the userProfile record via raw IDB (stores already exist)
 *  4. Reload — AppInitializer finds the profile, sets isAuthenticated=true,
 *     GuestOnly redirects to /  (Dashboard)
 *  5. Navigate client-side to targetPath by clicking the nav link (no reload)
 */
export async function setupAuth(page: Page, targetPath = '/') {
  // Step 1 — load app and let Dexie create the DB
  await page.goto('/')

  // Step 2 — wait for the auth-guard redirect to /login (DB is now open)
  await page.waitForURL('**/login', { timeout: 10_000 })

  // Step 3 — write userProfile (stores are guaranteed to exist now)
  await page.evaluate(() => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MiNetCRM') // open at current version (no upgrade)
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('userProfile', 'readwrite')
        tx.objectStore('userProfile').put({
          id: 'current-user',
          displayName: 'Test User',
          updatedAt: new Date().toISOString(),
        })
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  })

  // Step 4 — reload; AppInitializer now finds the profile → Dashboard
  await page.reload()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8_000 })

  // Step 5 — client-side navigation to targetPath (avoids full-reload auth loss)
  // Click the nav link so React Router handles the navigation natively
  if (targetPath !== '/') {
    const navLink = page.locator(`a[href="${targetPath}"]`).first()
    const linkVisible = await navLink.isVisible().catch(() => false)
    if (linkVisible) {
      await navLink.click()
    } else {
      // Fallback for paths without a nav link (e.g. /reminders)
      await page.evaluate((path) => window.history.pushState({}, '', path), targetPath)
      await page.evaluate(() => window.dispatchEvent(new Event('popstate')))
    }
    await page.waitForFunction(
      (path) => window.location.pathname === path,
      targetPath,
      { timeout: 8_000 },
    )
  }
}
