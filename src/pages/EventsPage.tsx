import { Link } from 'react-router-dom'
import { Plus, Calendar, MapPin, Users, ChevronRight, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useEvents } from '@/hooks/useEvents'
import { formatDate } from '@/lib/utils'

export default function EventsPage() {
  const events = useEvents()
  const today = new Date().toISOString().slice(0, 10)

  const upcoming = events.filter(e => e.date >= today)
  const past = events.filter(e => e.date < today)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Sự kiện ({events.length})</h1>
          <Link to="/events/new">
            <Button size="sm" className="gap-1.5">
              <Plus size={16} />
              Thêm
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 py-4 space-y-6">
        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
              <Calendar size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Chưa có sự kiện nào</p>
            <Link to="/events/new">
              <Button size="sm">+ Thêm sự kiện đầu tiên</Button>
            </Link>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <section>
                <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-300 mb-3">Sắp tới ({upcoming.length})</h2>
                <div className="space-y-2">
                  {upcoming.map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </section>
            )}

            {past.length > 0 && (
              <section>
                <h2 className="font-semibold text-sm text-muted-foreground mb-3">Đã qua ({past.length})</h2>
                <div className="space-y-2">
                  {past.map(event => (
                    <EventCard key={event.id} event={event} isPast />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function EventCard({ event, isPast = false }: { event: ReturnType<typeof useEvents>[number]; isPast?: boolean }) {
  const hasOutcome = !!event.outcome
  const hasNextSteps = !!event.nextSteps

  return (
    <Link to={`/events/${event.id}`}>
      <Card className={`hover:shadow-md transition-shadow ${isPast ? 'opacity-75' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isPast ? 'bg-gray-100 dark:bg-gray-700' : 'bg-blue-100 dark:bg-blue-900/40'
            }`}>
              <Calendar size={18} className={isPast ? 'text-gray-500 dark:text-gray-400' : 'text-blue-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-sm leading-tight">{event.title}</h3>
                <ChevronRight size={16} className="text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />
              </div>

              <div className="flex flex-wrap gap-2 mt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar size={11} />
                  <span>{formatDate(event.date)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin size={11} />
                    <span className="truncate max-w-[100px]">{event.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users size={11} />
                  <span>{event.contactIds.length} người</span>
                </div>
              </div>

              {/* Indicators */}
              {(hasOutcome || hasNextSteps) && (
                <div className="flex gap-2 mt-2">
                  {hasOutcome && (
                    <Badge variant="secondary" className="text-[10px] gap-1 py-0">
                      <CheckCircle2 size={10} className="text-green-500" />
                      Có kết quả
                    </Badge>
                  )}
                  {hasNextSteps && (
                    <Badge variant="secondary" className="text-[10px] gap-1 py-0">
                      Có bước tiếp theo
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
