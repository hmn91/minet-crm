import { db } from '@/lib/db'

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function isNotificationSupported(): boolean {
  return 'Notification' in window
}

export function isNotificationGranted(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export async function checkAndNotifyDueReminders(): Promise<void> {
  if (!isNotificationGranted()) return

  const now = new Date().toISOString()
  const dueReminders = await db.reminders
    .where('isCompleted')
    .equals(0)
    .and(r => r.dueDate <= now)
    .toArray()

  for (const reminder of dueReminders.slice(0, 5)) {
    const contact = await db.contacts.get(reminder.contactId)
    const title = contact
      ? `Nhắc nhở: ${contact.firstName} ${contact.lastName}`
      : 'Nhắc nhở MiNet CRM'

    new Notification(title, {
      body: reminder.title,
      icon: '/icons/pwa-192x192.png',
      badge: '/icons/pwa-192x192.png',
      tag: `reminder-${reminder.id}`,
    })
  }
}

export async function checkContactsNeedingFollowUp(leadDays: number): Promise<void> {
  if (!isNotificationGranted()) return

  const today = new Date()
  const limit = new Date(today)
  limit.setDate(limit.getDate() + leadDays)

  const contacts = await db.contacts
    .where('nextFollowUpAt')
    .between(today.toISOString(), limit.toISOString())
    .toArray()

  if (contacts.length === 0) return

  new Notification(`${contacts.length} liên hệ cần theo dõi`, {
    body: contacts.slice(0, 3).map(c => `${c.firstName} ${c.lastName}`).join(', '),
    icon: '/icons/pwa-192x192.png',
    tag: 'follow-up-reminder',
  })
}
