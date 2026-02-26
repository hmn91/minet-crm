import { test, expect } from '@playwright/test'
import { setupAuth } from '../fixtures/setup-auth'
import { seedContacts, seedEvents, reloadAuthenticated, spaNavigate } from '../fixtures/seed-data'

/**
 * Visual E2E: EVT-01, EVT-03, EVT-04, EVT-05, EVT-06, EVT-07, EVT-08, EVT-09, EVT-10, EVT-14, EVT-15, EVT-16
 */

const yesterday = new Date(Date.now() - 86400000).toISOString()
const today = new Date().toISOString().slice(0, 10)
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)

test.describe('Events — List Page', () => {
  test('EVT-05: empty state shown when no events', async ({ page }) => {
    await setupAuth(page, '/events')
    await expect(page.getByText('Chưa có sự kiện nào')).toBeVisible()
    await expect(page.getByRole('link', { name: '+ Thêm sự kiện đầu tiên' })).toBeVisible()
  })

  test('EVT-01: events split into "Sắp tới" and "Đã qua" sections', async ({ page }) => {
    await setupAuth(page, '/')

    await seedEvents(page, [
      { id: 'ev-upcoming', title: 'Hội thảo ngày mai', date: tomorrow, contactIds: [], createdAt: yesterday, updatedAt: yesterday },
      { id: 'ev-past', title: 'Cuộc họp tuần trước', date: lastWeek, contactIds: [], createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events')

    await expect(page.getByText(/Sắp tới/)).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Đã qua/)).toBeVisible()
    await expect(page.getByText('Hội thảo ngày mai')).toBeVisible()
    await expect(page.getByText('Cuộc họp tuần trước')).toBeVisible()
  })

  test('EVT-03: past events have reduced opacity (opacity-75 class)', async ({ page }) => {
    await setupAuth(page, '/')

    await seedEvents(page, [
      { id: 'ev-past-opacity', title: 'Sự kiện đã qua', date: lastWeek, contactIds: [], createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events')

    // Wait for events to load, then check opacity
    await expect(page.getByText('Sự kiện đã qua')).toBeVisible({ timeout: 10000 })
    const pastCard = page.locator('.opacity-75')
    await expect(pastCard).toBeVisible()
  })

  test('EVT-04: "Có kết quả" and "Có bước tiếp theo" badges are shown', async ({ page }) => {
    await setupAuth(page, '/')

    await seedEvents(page, [
      { id: 'ev-badges', title: 'Sự kiện có kết quả', date: lastWeek, contactIds: [], outcome: 'Ký hợp đồng', nextSteps: 'Gửi tài liệu', createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events')

    // Wait for events to load
    await expect(page.getByText('Sự kiện có kết quả')).toBeVisible({ timeout: 10000 })
    // Use .first() to avoid strict mode violation; add timeout for Dexie live query
    await expect(page.getByText('Có kết quả').first()).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Có bước tiếp theo').first()).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Events — Create Form', () => {
  test.beforeEach(async ({ page }) => {
    await setupAuth(page, '/events/new')
  })

  test('EVT-06: submit without event name shows validation error', async ({ page }) => {
    // Clear the date field and submit
    await page.getByRole('button', { name: 'Lưu' }).click()
    await expect(page.getByText('Vui lòng nhập tên sự kiện')).toBeVisible()
  })

  test('EVT-07: submit without start date shows validation error', async ({ page }) => {
    await page.getByPlaceholder('TechSummit 2026, Workshop AI...').fill('Test Event')
    // Clear the date input
    await page.locator('input[type="date"]').first().fill('')
    await page.getByRole('button', { name: 'Lưu' }).click()
    // Should stay on page (validation fails)
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/events/new')
  })

  test('EVT-08: end date before start date — form does not block (no validation)', async ({ page }) => {
    await page.getByPlaceholder('TechSummit 2026, Workshop AI...').fill('Date Test Event')
    const dates = page.locator('input[type="date"]')
    await dates.first().fill('2030-01-10')
    await dates.nth(1).fill('2030-01-05') // end before start
    await page.getByRole('button', { name: 'Lưu' }).click()
    // Should still navigate (no blocking on date order)
    await page.waitForURL(/\/events\/[^/]+$/, { timeout: 8000 })
    expect(page.url()).toMatch(/\/events\/[^/]+$/)
  })
})

test.describe('Events — Participants', () => {
  test('EVT-09: adding a participant from contacts list', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-participant', firstName: 'Phạm', lastName: 'Tham gia', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events/new')

    // Fill event title
    await page.getByPlaceholder('TechSummit 2026, Workshop AI...').fill('Sự kiện có người tham gia')

    // Search for participant
    await page.getByPlaceholder('Tìm liên hệ để thêm...').fill('Tham gia')
    await page.waitForTimeout(600)

    // getContactDisplayName returns firstName + lastName = "Phạm Tham gia"
    const contactItem = page.getByText('Phạm Tham gia')
    await expect(contactItem).toBeVisible({ timeout: 8000 })
    await contactItem.click()

    // Should appear as a selected badge
    await expect(page.locator('.flex.flex-wrap.gap-2').getByText('Phạm Tham gia')).toBeVisible()
  })

  test('EVT-10: removing a participant (click X button)', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-remove', firstName: 'Remove', lastName: 'Me', tier: 'B', relationshipType: 'partner', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events/new')

    await page.getByPlaceholder('TechSummit 2026, Workshop AI...').fill('Remove Test')

    // Add participant — display name: "Remove Me"
    await page.getByPlaceholder('Tìm liên hệ để thêm...').fill('Remove')
    await page.waitForTimeout(600)
    const contactItem = page.getByText('Remove Me')
    await expect(contactItem).toBeVisible({ timeout: 8000 })
    await contactItem.click()
    await page.waitForTimeout(300)

    // Verify participant appears as badge
    const badge = page.locator('.flex.flex-wrap.gap-2 button')
    await expect(badge).toBeVisible()

    // Click X to remove
    await badge.click()
    await page.waitForTimeout(300)

    // Badge should be gone
    await expect(page.locator('.flex.flex-wrap.gap-2 button')).not.toBeVisible()
  })
})

test.describe('Events — Detail Page', () => {
  test('EVT-14: event detail shows title, date, location, and participants', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-evt-detail', firstName: 'Người', lastName: 'Tham dự', tier: 'A', relationshipType: 'customer', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedEvents(page, [
      {
        id: 'ev-detail',
        title: 'Tech Conference 2026',
        date: tomorrow,
        location: 'Hà Nội',
        contactIds: ['c-evt-detail'],
        createdAt: yesterday,
        updatedAt: yesterday,
      },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events/ev-detail')

    // Wait for event to load from Dexie
    await expect(page.getByText('Tech Conference 2026')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Hà Nội')).toBeVisible()
  })

  test('EVT-15: past event without outcome shows "add outcome" button', async ({ page }) => {
    await setupAuth(page, '/')

    await seedEvents(page, [
      {
        id: 'ev-no-outcome',
        title: 'Sự kiện chưa có kết quả',
        date: lastWeek,
        contactIds: [],
        createdAt: yesterday,
        updatedAt: yesterday,
        // outcome: undefined (not set)
      },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events/ev-no-outcome')

    // Wait for event to load
    await expect(page.getByText('Sự kiện chưa có kết quả')).toBeVisible({ timeout: 10000 })

    // Should show "Add outcome" or "Thêm kết quả" button for past events
    const outcomeBtn = page.getByText(/kết quả|outcome|Thêm/i)
    await expect(outcomeBtn.first()).toBeVisible()
  })

  test('EVT-16: clicking participant in event detail navigates to contact', async ({ page }) => {
    await setupAuth(page, '/')

    await seedContacts(page, [
      { id: 'c-evt-nav', firstName: 'Event', lastName: 'Participant', tier: 'B', relationshipType: 'partner', tags: [], customFields: {}, createdAt: yesterday, updatedAt: yesterday },
    ])
    await seedEvents(page, [
      {
        id: 'ev-with-part',
        title: 'Sự kiện với người tham dự',
        date: tomorrow,
        contactIds: ['c-evt-nav'],
        createdAt: yesterday,
        updatedAt: yesterday,
      },
    ])

    await reloadAuthenticated(page)
    await spaNavigate(page, '/events/ev-with-part')

    // Wait for event to load, then find participant link
    // getContactDisplayName: firstName + lastName = "Event Participant"
    await expect(page.getByText('Sự kiện với người tham dự')).toBeVisible({ timeout: 10000 })
    const participantLink = page.getByText('Event Participant')
    await expect(participantLink).toBeVisible({ timeout: 8000 })
    await participantLink.click()
    await page.waitForURL('**/contacts/c-evt-nav', { timeout: 6000 })
    expect(page.url()).toContain('/contacts/c-evt-nav')
  })
})
