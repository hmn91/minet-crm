import { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, Phone, Mail, Globe, Plus, Calendar, MessageCircle } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useContact, deleteContact } from '@/hooks/useContacts'
import { useInteractions } from '@/hooks/useInteractions'
import { useReminders } from '@/hooks/useReminders'
import { useContactEvents } from '@/hooks/useEvents'
import { useCustomFieldDefs } from '@/hooks/useCustomFields'
import { useCompany } from '@/hooks/useCompanies'
import { getContactDisplayName, getInitials, formatDate, formatDateTime, formatRelativeTime, daysSince } from '@/lib/utils'
import type { Tier } from '@/types'
import { TIER_LABELS, RELATIONSHIP_TYPE_LABELS, INTERACTION_TYPE_LABELS } from '@/types'

const TIER_BADGE_VARIANT: Record<Tier, 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d'> = {
  A: 'tier_a', B: 'tier_b', C: 'tier_c', D: 'tier_d',
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const contact = useContact(id!)
  const company = useCompany(contact?.companyId)
  const interactions = useInteractions(id)
  const reminders = useReminders(id)
  const events = useContactEvents(id!)
  const customFieldDefs = useCustomFieldDefs()
  const [showDelete, setShowDelete] = useState(false)
  const [activeTab, setActiveTab] = useState('info')

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <p className="text-muted-foreground">Không tìm thấy liên hệ</p>
        <Link to="/contacts" className="mt-3 text-primary text-sm">← Quay lại</Link>
      </div>
    )
  }

  const displayName = getContactDisplayName(contact)
  const days = daysSince(contact.lastContactedAt)

  async function handleDelete() {
    await deleteContact(contact!.id)
    navigate('/contacts', { replace: true })
  }

  // Timeline: merge interactions + events
  const timeline = [
    ...interactions.map(i => ({ type: 'interaction' as const, date: i.date, data: i })),
    ...events.map(e => ({ type: 'event' as const, date: e.date, data: e })),
  ].sort((a, b) => b.date.localeCompare(a.date))

  const customFields = customFieldDefs.filter(def => contact.customFields[def.id])

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <Link to={`/contacts/${id}/edit`}>
              <Button variant="ghost" size="icon">
                <Edit2 size={18} />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} className="text-red-500">
              <Trash2 size={18} />
            </Button>
          </div>
        </div>
      </div>

      {/* Profile section */}
      <div className="px-4 py-6 bg-gradient-to-b from-blue-50 to-background">
        <div className="flex flex-col items-center text-center">
          <Avatar className="w-20 h-20 mb-3">
            <AvatarFallback className="bg-blue-100 text-blue-700 text-2xl font-bold">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={TIER_BADGE_VARIANT[contact.tier]}>
              Tier {contact.tier} — {TIER_LABELS[contact.tier]}
            </Badge>
          </div>
          {contact.title && (
            <p className="text-sm text-gray-600 mt-1">{contact.title}</p>
          )}
          {company && (
            <Link to={`/companies/${company.id}`} className="text-sm text-primary mt-0.5">
              {company.name}
            </Link>
          )}
          {contact.relationshipType && (
            <p className="text-xs text-muted-foreground mt-1">
              {RELATIONSHIP_TYPE_LABELS[contact.relationshipType]}
            </p>
          )}

          {/* Quick actions */}
          <div className="flex gap-3 mt-4">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border shadow-sm">
                <Phone size={18} className="text-green-600" />
                <span className="text-[10px] text-gray-500">Gọi</span>
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border shadow-sm">
                <Mail size={18} className="text-blue-600" />
                <span className="text-[10px] text-gray-500">Email</span>
              </a>
            )}
            {contact.linkedIn && (
              <a href={contact.linkedIn} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border shadow-sm">
                <Globe size={18} className="text-blue-700" />
                <span className="text-[10px] text-gray-500">LinkedIn</span>
              </a>
            )}
            <Link to={`/interactions/new?contactId=${id}`} className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border shadow-sm">
              <Plus size={18} className="text-purple-600" />
              <span className="text-[10px] text-gray-500">Ghi nhật ký</span>
            </Link>
          </div>

          {/* Tags */}
          {contact.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 justify-center">
              {contact.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
              ))}
            </div>
          )}

          {/* Last contact indicator */}
          {days !== null && (
            <div className={`mt-3 text-xs px-3 py-1 rounded-full ${
              days <= 7 ? 'bg-green-50 text-green-600' :
              days <= 30 ? 'bg-yellow-50 text-yellow-600' :
              'bg-red-50 text-red-600'
            }`}>
              Liên hệ lần cuối {days === 0 ? 'hôm nay' : `${days} ngày trước`}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full">
            <TabsTrigger value="info" className="flex-1">Thông tin</TabsTrigger>
            <TabsTrigger value="history" className="flex-1">Lịch sử ({timeline.length})</TabsTrigger>
            <TabsTrigger value="reminders" className="flex-1">Nhắc ({reminders.length})</TabsTrigger>
          </TabsList>

          {/* Info tab */}
          <TabsContent value="info" className="mt-4 space-y-4">
            {/* Contact info */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Liên hệ</h3>
                {contact.email && <InfoRow label="Email" value={contact.email} href={`mailto:${contact.email}`} />}
                {contact.phone && <InfoRow label="Điện thoại" value={contact.phone} href={`tel:${contact.phone}`} />}
                {contact.birthday && <InfoRow label="Sinh nhật" value={formatDate(contact.birthday)} />}
                {contact.linkedIn && <InfoRow label="LinkedIn" value="Xem hồ sơ" href={contact.linkedIn} />}
              </CardContent>
            </Card>

            {/* Custom fields */}
            {customFields.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Thông tin thêm</h3>
                  {customFields.map(def => (
                    <InfoRow
                      key={def.id}
                      label={def.name}
                      value={contact.customFields[def.id]}
                      href={def.type === 'url' ? contact.customFields[def.id] : undefined}
                    />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Follow-up */}
            {contact.nextFollowUpAt && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Nhắc nhở liên hệ</h3>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-primary" />
                    <span className="text-sm">{formatDate(contact.nextFollowUpAt)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes */}
            {contact.notes && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">Ghi chú</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{contact.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* History tab */}
          <TabsContent value="history" className="mt-4">
            <div className="flex justify-end mb-3">
              <Link to={`/interactions/new?contactId=${id}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus size={14} />
                  Thêm tương tác
                </Button>
              </Link>
            </div>
            {timeline.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Chưa có lịch sử tương tác</div>
            ) : (
              <div className="space-y-3 pb-4">
                {timeline.map(({ type, data }) => (
                  <TimelineItem key={`${type}-${data.id}`} type={type} data={data} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Reminders tab */}
          <TabsContent value="reminders" className="mt-4">
            <div className="flex justify-end mb-3">
              <Link to={`/reminders/new?contactId=${id}`}>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <Plus size={14} />
                  Thêm nhắc nhở
                </Button>
              </Link>
            </div>
            {reminders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Chưa có nhắc nhở</div>
            ) : (
              <div className="space-y-2 pb-4">
                {reminders.map(r => (
                  <Card key={r.id}>
                    <CardContent className="p-3 flex items-start gap-3">
                      <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                        <Calendar size={14} className="text-orange-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.title}</p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(r.dueDate)}</p>
                        {r.notes && <p className="text-xs text-gray-600 mt-1">{r.notes}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa liên hệ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa <strong>{displayName}</strong>? Thao tác này không thể hoàn tác.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDelete(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InfoRow({ label, value, href }: { label: string; value: string; href?: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      {href ? (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
          className="text-sm text-primary truncate text-right">
          {value}
        </a>
      ) : (
        <span className="text-sm text-gray-800 text-right truncate">{value}</span>
      )}
    </div>
  )
}

function TimelineItem({ type, data }: {
  type: 'interaction' | 'event'
  data: { id: string; date: string; notes?: string; outcome?: string; title?: string; type?: string; nextSteps?: string }
}) {
  const icons: Record<string, React.ReactNode> = {
    meeting: <MessageCircle size={14} className="text-blue-500" />,
    call: <Phone size={14} className="text-green-500" />,
    email: <Mail size={14} className="text-purple-500" />,
    event: <Calendar size={14} className="text-orange-500" />,
  }

  return (
    <Card>
      <CardContent className="p-3 flex gap-3">
        <div className="w-7 h-7 bg-gray-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          {type === 'event' ? (
            <Calendar size={14} className="text-orange-500" />
          ) : (
            icons[data.type ?? 'other'] ?? <MessageCircle size={14} className="text-gray-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm">
              {type === 'event' ? (data.title ?? 'Sự kiện') : INTERACTION_TYPE_LABELS[data.type as keyof typeof INTERACTION_TYPE_LABELS] ?? 'Tương tác'}
            </span>
            <span className="text-xs text-muted-foreground shrink-0">{formatRelativeTime(data.date)}</span>
          </div>
          {data.notes && <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{data.notes}</p>}
          {data.outcome && (
            <p className="text-xs text-green-700 mt-1 bg-green-50 px-2 py-1 rounded">
              Kết quả: {data.outcome}
            </p>
          )}
          {data.nextSteps && (
            <p className="text-xs text-blue-700 mt-1 bg-blue-50 px-2 py-1 rounded">
              Bước tiếp: {data.nextSteps}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
