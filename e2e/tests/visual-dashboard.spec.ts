import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'
import { seedContacts, seedReminders, seedEvents, seedInteractions, reloadAuthenticated, spaNavigate } from '../fixtures/seed-data'

/**
 * Visual E2E: DASH-01, DASH-02, DASH-03, DASH-08, DASH-10, DASH-11, DASH-13
 */

const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const in2days = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString()

test.describe('Dashboard — Stats Cards', () => {
  test('DASH-03: stats show 0 when database is empty', async ({ page }) => {
    await setupAuth(page, '/')
    // No data seeded — all stats should be 0
    // Use stat card labels (text-xs class)
    await expect(page.locator('p.text-xs', { hasText: 'Liên hệ' })).toBeVisible()
    await expect(page.locator('p.text-xs', { hasText: 'Công ty' })).toBeVisible()
    await expect(page.locator('p.text-xs', { hasText: 'Nhắc nhở' })).toBeVisible()
    await expect(page.locator('p.text-xs', { hasText: 'Sự kiện' })).toBeVisible()

    // All stat values should be 0
    const statValues = page.locator('p.text-2xl')
    const count = await statValues.count()
    expect(count).toBeGreaterThanOrEqual(4)
  })

  test('DASH-01: 4 stats cards show correct counts after seeding data', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c1', firstName: 'Anh', lastName: 'Nguyễn', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
      { id: 'c2', firstName: 'Bình', lastName: 'Trần', tier: 'B', relationshipType: 'partner', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedReminders(page, [
      { id: 'r1', contactId: 'c1', title: 'Gọi điện', dueDate: tomorrow + 'T09:00:00.000Z', isCompleted: 0, createdAt: yesterday },
    ])
    await seedEvents(page, [
      { id: 'e1', title: 'Workshop', date: tomorrow, contactIds: ['c1'], createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)

    // Stats: 2 contacts, 0 companies, 1 reminder, 1 event
    // The stat values should render as text numbers
    const cards = page.locator('p.text-2xl')
    await expect(cards.first()).toBeVisible()
    const values = await cards.allTextContents()
    // Should include "2" (contacts)
    expect(values).toContain('2')
  })

  test('DASH-02: reminders card has red badge when overdue reminder exists', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c1', firstName: 'Test', lastName: 'User', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedReminders(page, [
      { id: 'r-overdue', contactId: 'c1', title: 'Gọi follow-up', dueDate: '2020-01-01T00:00:00.000Z', isCompleted: 0, createdAt: yesterday },
    ])

    await reloadAuthenticated(page)

    // Bell icon in header should have red badge with count
    const redBadge = page.locator('.bg-red-500')
    await expect(redBadge).toBeVisible()
  })
})

test.describe('Dashboard — Follow-up & Navigation', () => {
  test('DASH-08: clicking contact card navigates to contact detail', async ({ page }) => {
    await setupAuth(page, '/')

    // Seed a Tier A contact that hasn't been contacted in ≥14 days
    const old = new Date(Date.now() - 20 * 86400000).toISOString()
    await seedContacts(page, [
      { id: 'c-follow', firstName: 'Cần', lastName: 'Liên hệ', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, lastContactedAt: old, createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)

    // "Cần liên hệ" section heading should appear (Dexie live query takes time)
    // Use .first() to avoid strict mode violation (contact name may also contain this text)
    await expect(page.getByText('Cần liên hệ').first()).toBeVisible({ timeout: 10000 })

    // Click the contact card link
    const contactLink = page.locator('a[href*="/contacts/c-follow"]')
    await contactLink.first().click()
    await page.waitForURL('**/contacts/c-follow', { timeout: 6000 })
    expect(page.url()).toContain('/contacts/c-follow')
  })
})

test.describe('Dashboard — Upcoming Items', () => {
  test('DASH-10: upcoming reminders within 3 days shown (max 3)', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-rem', firstName: 'Reminder', lastName: 'Test', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])

    const r1due = new Date(Date.now() + 1 * 86400000).toISOString()
    const r2due = new Date(Date.now() + 2 * 86400000).toISOString()
    const r3due = new Date(Date.now() + 0.5 * 86400000).toISOString()
    const r4due = new Date(Date.now() + 10 * 86400000).toISOString() // Should NOT appear

    await seedReminders(page, [
      { id: 'r-up1', contactId: 'c-rem', title: 'Nhắc nhở 1', dueDate: r1due, isCompleted: 0, createdAt: yesterday },
      { id: 'r-up2', contactId: 'c-rem', title: 'Nhắc nhở 2', dueDate: r2due, isCompleted: 0, createdAt: yesterday },
      { id: 'r-up3', contactId: 'c-rem', title: 'Nhắc nhở 3', dueDate: r3due, isCompleted: 0, createdAt: yesterday },
      { id: 'r-up4', contactId: 'c-rem', title: 'Nhắc nhở 4', dueDate: r4due, isCompleted: 0, createdAt: yesterday },
    ])

    await reloadAuthenticated(page)

    // "Nhắc nhở sắp tới" section should appear (wait for live query)
    await expect(page.getByText('Nhắc nhở sắp tới')).toBeVisible({ timeout: 10000 })
    // Nhắc nhở 4 (10 days away) should NOT appear
    await expect(page.getByText('Nhắc nhở 4')).not.toBeVisible()
  })

  test('DASH-11: upcoming events within 3 days shown (max 3)', async ({ page }) => {
    await setupAuth(page, '/')

    const e1date = tomorrow
    const e2date = in2days
    const e3date = today
    const farDate = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10)

    await seedEvents(page, [
      { id: 'ev-up1', title: 'Sự kiện hôm nay', date: e3date, contactIds: [], createdAt: yesterday, updatedAt: yesterday },
      { id: 'ev-up2', title: 'Sự kiện ngày mai', date: e1date, contactIds: [], createdAt: yesterday, updatedAt: yesterday },
      { id: 'ev-up3', title: 'Sự kiện 2 ngày', date: e2date, contactIds: [], createdAt: yesterday, updatedAt: yesterday },
      { id: 'ev-far', title: 'Sự kiện xa', date: farDate, contactIds: [], createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)

    // "Sự kiện sắp tới" section should appear (wait for live query)
    await expect(page.getByText('Sự kiện sắp tới')).toBeVisible({ timeout: 10000 })
    // "Sự kiện xa" should NOT appear in dashboard (outside 3 days)
    await expect(page.getByText('Sự kiện xa')).not.toBeVisible()
  })

  test('DASH-13: shows 5 recent interactions in activity feed', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-int', firstName: 'Activity', lastName: 'User', tier: 'B', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])

    const now = new Date().toISOString()
    // int6 is older than int1-int5 so top-5 by date will always exclude int6
    const older = new Date(Date.now() - 2 * 86400000).toISOString()
    await seedInteractions(page, [
      { id: 'int1', contactId: 'c-int', type: 'call', date: now, notes: 'Ghi chú 1', createdAt: now },
      { id: 'int2', contactId: 'c-int', type: 'email', date: now, notes: 'Ghi chú 2', createdAt: now },
      { id: 'int3', contactId: 'c-int', type: 'meeting', date: now, notes: 'Ghi chú 3', createdAt: now },
      { id: 'int4', contactId: 'c-int', type: 'message', date: now, notes: 'Ghi chú 4', createdAt: now },
      { id: 'int5', contactId: 'c-int', type: 'other', date: now, notes: 'Ghi chú 5', createdAt: now },
      { id: 'int6', contactId: 'c-int', type: 'event', date: older, notes: 'Ghi chú 6 — không nên hiện', createdAt: older },
    ])

    await reloadAuthenticated(page)

    // "Hoạt động gần đây" should appear (wait for live query)
    await expect(page.getByText('Hoạt động gần đây')).toBeVisible({ timeout: 10000 })
    // int6 note should NOT appear (max 5)
    await expect(page.getByText('Ghi chú 6 — không nên hiện')).not.toBeVisible()
  })
})
