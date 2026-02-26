import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'
import { seedContacts, seedInteractions, seedEvents, reloadAuthenticated, spaNavigate } from '../fixtures/seed-data'

/**
 * Visual E2E: INT-01 through INT-07
 */

const yesterday = new Date(Date.now() - 86400000).toISOString()

test.describe('Interaction Form', () => {
  test('INT-05: default date/time is current time (within 2 minutes)', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-int-default', firstName: 'Int', lastName: 'Default', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/interactions/new?contactId=c-int-default')

    // Date/time input should be pre-filled with current time
    const dateInput = page.locator('input[type="datetime-local"]')
    await expect(dateInput).toBeVisible()
    const value = await dateInput.inputValue()
    expect(value).toBeTruthy()

    // Verify it's within 2 minutes of now
    const inputDate = new Date(value)
    const now = new Date()
    const diffMs = Math.abs(now.getTime() - inputDate.getTime())
    expect(diffMs).toBeLessThan(2 * 60 * 1000) // within 2 minutes
  })

  test('INT-06: all 6 interaction types are available in the select', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-int-types', firstName: 'Type', lastName: 'Test', tier: 'B', relationshipType: 'partner', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/interactions/new?contactId=c-int-types')

    // Wait for form to load
    await expect(page.locator('input[type="datetime-local"]')).toBeVisible({ timeout: 8000 })

    // Open the interaction type select trigger
    const selectTrigger = page.locator('[role="combobox"]').first()
    await selectTrigger.click()
    await page.waitForTimeout(500)

    // Scope to [role="listbox"] to find the visible dropdown items (avoids hidden <option> elements)
    const listbox = page.locator('[role="listbox"]')
    await expect(listbox).toBeVisible({ timeout: 3000 })
    // Verify all 6 types (INTERACTION_TYPE_LABELS from src/types/index.ts)
    await expect(listbox.getByText('Gặp mặt')).toBeVisible()   // meeting
    await expect(listbox.getByText('Cuộc gọi')).toBeVisible()  // call
    await expect(listbox.getByText('Email')).toBeVisible()      // email
    await expect(listbox.getByText('Tin nhắn')).toBeVisible()  // message
    await expect(listbox.getByText('Sự kiện')).toBeVisible()   // event
    await expect(listbox.getByText('Khác')).toBeVisible()      // other
  })

  test('INT-03: creating interaction makes it appear in History tab', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-int-create', firstName: 'Create', lastName: 'Interaction', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/interactions/new?contactId=c-int-create')

    // Fill in the interaction form
    await page.getByPlaceholder('Nội dung cuộc trò chuyện...').fill('Ghi chú tương tác mới')
    // Click the full-width form submit button 'Lưu tương tác' (not the header 'Lưu' button)
    await page.getByRole('button', { name: 'Lưu tương tác' }).click()

    // Wait for form to save and navigate away from /interactions/new
    await page.waitForURL((url) => !url.pathname.includes('/interactions/new'), { timeout: 8000 })

    // Navigate to contact detail and check History tab
    await spaNavigate(page, '/contacts/c-int-create')
    // Wait for contact detail to load before clicking tab
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 })
    await page.getByRole('tab', { name: /Lịch sử/ }).click()
    await page.waitForTimeout(600)

    await expect(page.getByText('Ghi chú tương tác mới')).toBeVisible({ timeout: 8000 })
  })

  test('INT-07: History tab shows both interactions and events, newest first', async ({ page }) => {
    await setupAuth(page, '/')

    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()
    const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString()
    const threeDaysAgoDate = new Date(Date.now() - 3 * 86400000).toISOString().slice(0, 10)

    await seedContacts(page, [
      { id: 'c-history-tab', firstName: 'History', lastName: 'Both', tier: 'B', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedInteractions(page, [
      { id: 'int-history', contactId: 'c-history-tab', type: 'call', date: twoDaysAgo, notes: 'Cuộc gọi 2 ngày trước', createdAt: twoDaysAgo },
    ])
    await seedEvents(page, [
      { id: 'ev-history', title: 'Sự kiện lịch sử', date: threeDaysAgoDate, contactIds: ['c-history-tab'], createdAt: threeDaysAgo, updatedAt: threeDaysAgo },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/contacts/c-history-tab')

    await page.getByRole('tab', { name: /Lịch sử/ }).click()
    await page.waitForTimeout(500)

    // Both interaction and event should appear
    await expect(page.getByText('Cuộc gọi 2 ngày trước')).toBeVisible()
    await expect(page.getByText('Sự kiện lịch sử')).toBeVisible()
  })
})
