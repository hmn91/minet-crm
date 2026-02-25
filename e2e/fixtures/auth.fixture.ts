import { test as base, type Page } from '@playwright/test'
import { setupAuth } from './setup-auth'

/**
 * Playwright fixture that sets up an authenticated session
 * by seeding the IndexedDB userProfile via raw IDB API.
 */
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ page }, use) => {
    await setupAuth(page)
    await use(page)
  },
})

export { expect } from '@playwright/test'
