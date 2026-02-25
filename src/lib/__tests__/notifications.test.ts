import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isNotificationSupported,
  isNotificationGranted,
  requestNotificationPermission,
  checkAndNotifyDueReminders,
} from '@/lib/notifications'
import { resetDb, seedContact, seedReminder } from '@/test/helpers/db-helpers'

beforeEach(async () => {
  await resetDb()
})

describe('isNotificationSupported', () => {
  it('returns true when Notification is in window', () => {
    expect(isNotificationSupported()).toBe(true)
  })
})

describe('isNotificationGranted', () => {
  it('returns false when permission is "default"', () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    })
    expect(isNotificationGranted()).toBe(false)
  })

  it('returns true when permission is "granted"', () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    })
    expect(isNotificationGranted()).toBe(true)
  })
})

describe('requestNotificationPermission', () => {
  it('returns true when permission is already granted', async () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    })
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it('calls requestPermission and returns true when granted', async () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    })
    ;(globalThis.Notification as unknown as { requestPermission: ReturnType<typeof vi.fn> }).requestPermission =
      vi.fn().mockResolvedValue('granted')
    const result = await requestNotificationPermission()
    expect(result).toBe(true)
  })

  it('returns false when permission is denied', async () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    })
    ;(globalThis.Notification as unknown as { requestPermission: ReturnType<typeof vi.fn> }).requestPermission =
      vi.fn().mockResolvedValue('denied')
    const result = await requestNotificationPermission()
    expect(result).toBe(false)
  })
})

describe('checkAndNotifyDueReminders', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'granted',
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'default',
      writable: true,
      configurable: true,
    })
  })

  it('does nothing when permission is not granted', async () => {
    Object.defineProperty(globalThis.Notification, 'permission', {
      value: 'denied',
      writable: true,
      configurable: true,
    })
    const NotificationSpy = vi.fn()
    const orig = globalThis.Notification
    ;(globalThis as Record<string, unknown>).Notification = Object.assign(NotificationSpy, {
      permission: 'denied',
      requestPermission: vi.fn(),
    })
    await checkAndNotifyDueReminders()
    expect(NotificationSpy).not.toHaveBeenCalled()
    ;(globalThis as Record<string, unknown>).Notification = orig
  })

  it('fires a Notification for each overdue incomplete reminder (max 5)', async () => {
    const contact = await seedContact({ firstName: 'Ngọc', lastName: 'Hà' })
    const pastDate = new Date(Date.now() - 86400000).toISOString()
    await seedReminder(contact.id, { dueDate: pastDate, isCompleted: false })
    await seedReminder(contact.id, { dueDate: pastDate, isCompleted: false })

    // A completed reminder should NOT trigger
    await seedReminder(contact.id, { dueDate: pastDate, isCompleted: true })

    const NotificationSpy = vi.fn()
    const orig = globalThis.Notification
    ;(globalThis as Record<string, unknown>).Notification = Object.assign(NotificationSpy, {
      permission: 'granted',
      requestPermission: vi.fn(),
    })

    await checkAndNotifyDueReminders()
    expect(NotificationSpy).toHaveBeenCalledTimes(2)

    ;(globalThis as Record<string, unknown>).Notification = orig
  })
})
