import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Users, Building2, Calendar, Clock, TrendingUp } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUpcomingReminders } from '@/hooks/useReminders'
import { useUpcomingEvents } from '@/hooks/useEvents'
import { db } from '@/lib/db'
import { getContactDisplayName, getInitials, daysSince, formatRelativeTime } from '@/lib/utils'
import type { Tier } from '@/types'

const TIER_BADGE_VARIANT: Record<Tier, 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d'> = {
  A: 'tier_a', B: 'tier_b', C: 'tier_c', D: 'tier_d',
}

export default function Dashboard() {
  const { userProfile } = useAuthStore()
  const { settings } = useSettingsStore()

  // Stats
  const totalContacts = useLiveQuery(() => db.contacts.count()) ?? 0
  const totalCompanies = useLiveQuery(() => db.companies.count()) ?? 0
  const totalEvents = useLiveQuery(() => db.events.count()) ?? 0
  const pendingReminders = useLiveQuery(() => db.reminders.where('isCompleted').equals(0).count()) ?? 0

  // Contacts needing follow-up (overdue or no recent contact)
  const contactsNeedingFollowUp = useLiveQuery(async () => {
    const contacts = await db.contacts.where('tier').anyOf(['A', 'B']).toArray()
    return contacts
      .filter(c => {
        const days = daysSince(c.lastContactedAt)
        const threshold = c.tier === 'A' ? 14 : 30
        return days === null || days >= threshold
      })
      .sort((a, b) => {
        const da = daysSince(a.lastContactedAt) ?? 999
        const db2 = daysSince(b.lastContactedAt) ?? 999
        return db2 - da
      })
      .slice(0, 5)
  }) ?? []

  // Recent interactions
  const recentInteractions = useLiveQuery(async () => {
    const interactions = await db.interactions.orderBy('date').reverse().limit(5).toArray()
    const contacts = await Promise.all(
      interactions.map(i => db.contacts.get(i.contactId))
    )
    return interactions.map((inter, i) => ({ inter, contact: contacts[i] }))
  }) ?? []

  const upcomingReminders = useUpcomingReminders(settings.reminderLeadDays)
  const upcomingEvents = useUpcomingEvents(3)

  const isLoading = useLiveQuery(() => db.contacts.count().then(() => false)) === undefined

  const avatarUrl = userProfile?.customAvatarBase64 ?? userProfile?.avatarUrl
  const displayName = userProfile?.displayName ?? 'Bạn'
  const firstName = displayName.split(' ').pop() ?? displayName

  return (
    <div className="px-4 pt-4 space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">MiNet CRM</h1>
          <p className="text-sm text-muted-foreground">Xin chào, {firstName}!</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/reminders" className="relative">
            <Bell size={22} className="text-gray-600" />
            {pendingReminders > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {pendingReminders > 9 ? '9+' : pendingReminders}
              </span>
            )}
          </Link>
          <Link to="/profile">
            <Avatar className="w-9 h-9">
              {avatarUrl ? (
                <AvatarImage src={avatarUrl} alt={displayName} />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(displayName)}
                </AvatarFallback>
              )}
            </Avatar>
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border space-y-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-7 w-10" />
              <Skeleton className="h-3 w-14" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={<Users size={20} className="text-blue-500" />} value={totalContacts} label="Liên hệ" to="/contacts" />
          <StatCard icon={<Building2 size={20} className="text-purple-500" />} value={totalCompanies} label="Công ty" to="/companies" />
          <StatCard icon={<Bell size={20} className="text-orange-500" />} value={pendingReminders} label="Nhắc nhở" to="/reminders" />
          <StatCard icon={<Calendar size={20} className="text-green-500" />} value={totalEvents} label="Sự kiện" to="/events" />
        </div>
      )}

      {/* Contacts needing follow-up */}
      {contactsNeedingFollowUp.length > 0 && (
        <section>
          <SectionHeader title="Cần liên hệ" to="/contacts" />
          <div className="space-y-2">
            {contactsNeedingFollowUp.map(contact => {
              const days = daysSince(contact.lastContactedAt)
              return (
                <Link key={contact.id} to={`/contacts/${contact.id}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 shrink-0">
                          <AvatarFallback className="bg-gray-100 text-gray-700 text-sm font-medium">
                            {getInitials(getContactDisplayName(contact))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{getContactDisplayName(contact)}</span>
                            <Badge variant={TIER_BADGE_VARIANT[contact.tier]} className="text-[10px] shrink-0">
                              {contact.tier}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-orange-500">
                            <Clock size={12} />
                            <span className="text-xs font-medium">
                              {days === null ? 'Chưa liên hệ' : `${days} ngày`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Upcoming reminders */}
      {upcomingReminders.length > 0 && (
        <section>
          <SectionHeader title="Nhắc nhở sắp tới" to="/reminders" />
          <div className="space-y-2">
            {upcomingReminders.slice(0, 3).map(reminder => (
              <ReminderItem key={reminder.id} reminderId={reminder.id} title={reminder.title} dueDate={reminder.dueDate} contactId={reminder.contactId} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming events */}
      {upcomingEvents.length > 0 && (
        <section>
          <SectionHeader title="Sự kiện sắp tới" to="/events" />
          <div className="space-y-2">
            {upcomingEvents.map(event => (
              <Link key={event.id} to={`/events/${event.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                      <Calendar size={18} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{formatRelativeTime(event.date)} · {event.contactIds.length} người</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      {recentInteractions.length > 0 && (
        <section>
          <SectionHeader title="Hoạt động gần đây" to="/contacts" />
          <div className="space-y-2">
            {recentInteractions.map(({ inter, contact }) => (
              contact ? (
                <Link key={inter.id} to={`/contacts/${inter.contactId}`}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                        <TrendingUp size={16} className="text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{getContactDisplayName(contact)}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {inter.notes ?? `Tương tác ${inter.type}`} · {formatRelativeTime(inter.date)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ) : null
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {totalContacts === 0 && (
        <div className="text-center py-12">
          <Users size={48} className="mx-auto text-gray-200 mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Bắt đầu xây dựng mạng lưới</h3>
          <p className="text-sm text-muted-foreground mb-4">Thêm liên hệ đầu tiên của bạn</p>
          <Link to="/contacts/new" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium">
            + Thêm liên hệ
          </Link>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, value, label, to }: { icon: React.ReactNode; value: number; label: string; to: string }) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function SectionHeader({ title, to }: { title: string; to: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="font-semibold text-gray-800">{title}</h2>
      <Link to={to} className="text-xs text-primary flex items-center gap-0.5">
        Xem tất cả <ChevronRight size={14} />
      </Link>
    </div>
  )
}

function ReminderItem({ title, dueDate, contactId }: { reminderId?: string; title: string; dueDate: string; contactId: string }) {
  const contact = useLiveQuery(() => db.contacts.get(contactId), [contactId])
  return (
    <Link to={`/contacts/${contactId}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
            <Bell size={16} className="text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{title}</p>
            {contact && (
              <p className="text-xs text-muted-foreground truncate">{getContactDisplayName(contact)}</p>
            )}
          </div>
          <span className="text-xs text-orange-600 shrink-0">{formatRelativeTime(dueDate)}</span>
        </CardContent>
      </Card>
    </Link>
  )
}
