import type { Page } from '@playwright/test'

/**
 * Seeds test data into IndexedDB after the DB is initialized.
 * Must be called after setupAuth() (which ensures DB schema exists).
 */
export async function seedContacts(page: Page, contacts: object[]) {
  await page.evaluate((rows) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MiNetCRM')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('contacts', 'readwrite')
        const store = tx.objectStore('contacts')
        rows.forEach((r) => store.put(r))
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, contacts)
}

export async function seedCompanies(page: Page, companies: object[]) {
  await page.evaluate((rows) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MiNetCRM')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('companies', 'readwrite')
        const store = tx.objectStore('companies')
        rows.forEach((r) => store.put(r))
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, companies)
}

export async function seedEvents(page: Page, events: object[]) {
  await page.evaluate((rows) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MiNetCRM')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('events', 'readwrite')
        const store = tx.objectStore('events')
        rows.forEach((r) => store.put(r))
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, events)
}

export async function seedReminders(page: Page, reminders: object[]) {
  await page.evaluate((rows) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MiNetCRM')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('reminders', 'readwrite')
        const store = tx.objectStore('reminders')
        rows.forEach((r) => store.put(r))
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, reminders)
}

export async function seedInteractions(page: Page, interactions: object[]) {
  await page.evaluate((rows) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MiNetCRM')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('interactions', 'readwrite')
        const store = tx.objectStore('interactions')
        rows.forEach((r) => store.put(r))
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, interactions)
}

export async function seedCustomFieldDefs(page: Page, defs: object[]) {
  await page.evaluate((rows) => {
    return new Promise<void>((resolve, reject) => {
      const req = indexedDB.open('MiNetCRM')
      req.onsuccess = () => {
        const db = req.result
        const tx = db.transaction('customFieldDefs', 'readwrite')
        const store = tx.objectStore('customFieldDefs')
        rows.forEach((r) => store.put(r))
        tx.oncomplete = () => { db.close(); resolve() }
        tx.onerror = () => reject(tx.error)
      }
      req.onerror = () => reject(req.error)
    })
  }, defs)
}

/** SPA navigate without full reload (preserves auth state in IDB).
 *  Tries pushState + PopStateEvent first (React Router v7 idx/key format).
 *  Falls back to: go to '/' (confirms auth), then retry SPA from stable state.
 */
export async function spaNavigate(page: Page, path: string) {
  const pathname = path.split('?')[0].split('#')[0]

  // Helper: fire a SPA navigation attempt
  const trySpaPush = () => page.evaluate((p) => {
    const idx = (window.history.state?.idx ?? 0) + 1
    const key = Math.random().toString(36).slice(2, 10)
    window.history.pushState({ idx, key }, '', p)
    window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
  }, path)

  // Attempt 1: SPA push from current location (fast path)
  await trySpaPush()
  const navigated = await page.waitForFunction(
    (p) => window.location.pathname === p,
    pathname,
    { timeout: 6000 }
  ).then(() => true).catch(() => false)

  if (!navigated) {
    // Fallback: ensure app is on '/' with auth confirmed, then retry SPA push.
    // This handles cases where React Router's async auth check causes temporary
    // redirect to /login before the popstate is handled correctly.
    const currentPath = new URL(page.url()).pathname
    if (currentPath !== '/') {
      // Reload to '/' to confirm auth, then navigate from stable state
      await page.reload()
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8000 })
    }
    // Retry SPA from known-good authenticated state
    await trySpaPush()
    await page.waitForFunction(
      (p) => window.location.pathname === p,
      pathname,
      { timeout: 10000 }
    )
  }
}

/** Reload page and wait for auth-guarded route (not /login) */
export async function reloadAuthenticated(page: Page) {
  await page.reload()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 8000 })
}
