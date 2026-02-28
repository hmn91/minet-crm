import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Edit2, Trash2, MapPin, Calendar, Users, CheckSquare, ArrowRight } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useEvent, deleteEvent } from '@/hooks/useEvents'
import { db } from '@/lib/db'
import { getContactDisplayName, getInitials, formatDate } from '@/lib/utils'
import type { Tier } from '@/types'

type TierBadge = 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d'
const TIER_BADGE: Record<Tier, TierBadge> = { A: 'tier_a', B: 'tier_b', C: 'tier_c', D: 'tier_d' }

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const event = useEvent(id!)
  const [showDelete, setShowDelete] = useState(false)

  const contacts = useLiveQuery(async () => {
    if (!event?.contactIds?.length) return []
    return Promise.all(event.contactIds.map(cId => db.contacts.get(cId)))
  }, [event?.contactIds])

  if (!event) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">Không tìm thấy sự kiện</p>
        <Link to="/events" className="text-primary text-sm mt-3">← Quay lại</Link>
      </div>
    )
  }

  async function handleDelete() {
    await deleteEvent(event!.id)
    navigate('/events', { replace: true })
  }

  const isPast = event.date < new Date().toISOString().slice(0, 10)

  return (
    <div className="min-h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <Link to={`/events/${id}/edit`}>
            <Button variant="ghost" size="icon">
              <Edit2 size={18} />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} className="text-red-500">
            <Trash2 size={18} />
          </Button>
        </div>
      </div>

      <div className="px-4 py-6 space-y-5">
        {/* Title & date */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex-1">{event.title}</h1>
            {isPast && <Badge variant="secondary" className="text-xs shrink-0">Đã qua</Badge>}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mt-2">
            <div className="flex items-center gap-1">
              <Calendar size={14} className="text-blue-500" />
              <span>{formatDate(event.date)}</span>
              {event.endDate && event.endDate !== event.date && (
                <span> — {formatDate(event.endDate)}</span>
              )}
            </div>
            {event.location && (
              <div className="flex items-center gap-1">
                <MapPin size={14} className="text-red-500" />
                <span>{event.location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Participants */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Users size={16} className="text-blue-500" />
              Người tham gia ({contacts?.filter(Boolean).length ?? event.contactIds.length})
            </h2>
          </div>
          {contacts && contacts.length > 0 ? (
            <div className="space-y-2">
              {contacts.filter(Boolean).map(contact => contact && (
                <Link key={contact.id} to={`/contacts/${contact.id}`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <Avatar className="w-9 h-9 shrink-0">
                        <AvatarFallback className="text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 font-medium">
                          {getInitials(getContactDisplayName(contact))}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-sm truncate">{getContactDisplayName(contact)}</span>
                          <Badge variant={TIER_BADGE[contact.tier]} className="text-[10px] shrink-0">{contact.tier}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{contact.title}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-300 dark:text-gray-600 shrink-0" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Chưa có người tham gia</p>
          )}
        </section>

        {/* Outcome */}
        {event.outcome && (
          <section>
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <CheckSquare size={16} className="text-green-500" />
              Kết quả sự kiện
            </h2>
            <Card className="border-green-200 bg-green-50 dark:bg-green-900/40">
              <CardContent className="p-4">
                <p className="text-sm text-green-800 whitespace-pre-wrap">{event.outcome}</p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Next steps */}
        {event.nextSteps && (
          <section>
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <ArrowRight size={16} className="text-blue-500" />
              Bước tiếp theo
            </h2>
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/40">
              <CardContent className="p-4">
                <p className="text-sm text-blue-800 whitespace-pre-wrap">{event.nextSteps}</p>
                {event.followUpDate && (
                  <div className="flex items-center gap-1.5 mt-3 text-blue-700">
                    <Calendar size={13} />
                    <span className="text-xs font-medium">Follow-up: {formatDate(event.followUpDate)}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Empty outcome prompt */}
        {isPast && !event.outcome && (
          <Card className="border-dashed border-gray-300 dark:border-gray-600">
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Chưa có kết quả sự kiện</p>
              <Link to={`/events/${id}/edit`}>
                <Button variant="outline" size="sm">Thêm kết quả & bước tiếp theo</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa sự kiện</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Bạn có chắc muốn xóa <strong>{event.title}</strong>?
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
