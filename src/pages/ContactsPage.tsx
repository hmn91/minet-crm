import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, SlidersHorizontal, ChevronRight, Clock } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { SwipeToDelete } from '@/components/ui/swipe-to-delete'
import { useContacts, deleteContact } from '@/hooks/useContacts'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import { getContactDisplayName, getInitials, daysSince } from '@/lib/utils'
import type { Tier, RelationshipType } from '@/types'
import { TIER_LABELS, RELATIONSHIP_TYPE_LABELS } from '@/types'

const TIER_BADGE_VARIANT: Record<Tier, 'tier_a' | 'tier_b' | 'tier_c' | 'tier_d'> = {
  A: 'tier_a', B: 'tier_b', C: 'tier_c', D: 'tier_d',
}

export default function ContactsPage() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<Tier | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<RelationshipType | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  const isLoading = useLiveQuery(() => db.contacts.count()) === undefined

  const contacts = useContacts({
    search: search || undefined,
    tier: tierFilter !== 'all' ? tierFilter : undefined,
    relationshipType: typeFilter !== 'all' ? typeFilter : undefined,
  })

  // Group by tier
  const grouped = useMemo(() => {
    const tiers: Tier[] = ['A', 'B', 'C', 'D']
    return tiers
      .map(tier => ({
        tier,
        contacts: contacts.filter(c => c.tier === tier),
      }))
      .filter(g => g.contacts.length > 0)
  }, [contacts])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3 bg-background sticky top-0 z-10 border-b">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Liên hệ ({contacts.length})</h1>
          <Link to="/contacts/new">
            <Button size="sm" className="gap-1.5">
              <Plus size={16} />
              Thêm
            </Button>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground"
        >
          <SlidersHorizontal size={14} />
          Bộ lọc
          {(tierFilter !== 'all' || typeFilter !== 'all') && (
            <span className="w-2 h-2 bg-primary rounded-full" />
          )}
        </button>

        {/* Filters */}
        {showFilters && (
          <div className="flex gap-2">
            <Select value={tierFilter} onValueChange={(v) => setTierFilter(v as Tier | 'all')}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tier</SelectItem>
                {(['A', 'B', 'C', 'D'] as Tier[]).map(t => (
                  <SelectItem key={t} value={t}>Tier {t} — {TIER_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as RelationshipType | 'all')}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue placeholder="Loại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Contact list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="px-4 py-3 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border">
                <Skeleton className="w-11 h-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-3 w-8" />
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-400" />
            </div>
            <p className="text-gray-500 mb-4">
              {search ? 'Không tìm thấy liên hệ' : 'Chưa có liên hệ nào'}
            </p>
            {!search && (
              <Link to="/contacts/new">
                <Button size="sm">+ Thêm liên hệ đầu tiên</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="px-4 py-3 space-y-4">
            {grouped.map(({ tier, contacts: tierContacts }) => (
              <div key={tier}>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={TIER_BADGE_VARIANT[tier]} className="text-xs">
                    Tier {tier}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{TIER_LABELS[tier]} · {tierContacts.length}</span>
                </div>
                <div className="space-y-2">
                  {tierContacts.map(contact => (
                    <SwipeToDelete key={contact.id} onDelete={() => deleteContact(contact.id)}>
                      <ContactCard contact={contact} tier={tier} />
                    </SwipeToDelete>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ContactCard({ contact, tier }: { contact: ReturnType<typeof useContacts>[number]; tier: Tier }) {
  const days = daysSince(contact.lastContactedAt)
  const isOverdue = days !== null && (
    (tier === 'A' && days >= 14) ||
    (tier === 'B' && days >= 30)
  )

  return (
    <Link to={`/contacts/${contact.id}`}>
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border hover:shadow-sm transition-shadow active:scale-[0.98]">
        <Avatar className="w-11 h-11 shrink-0">
          <AvatarFallback className="bg-blue-50 text-blue-700 font-medium text-sm">
            {getInitials(getContactDisplayName(contact))}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{getContactDisplayName(contact)}</span>
            <Badge variant={TIER_BADGE_VARIANT[tier]} className="text-[10px] px-1.5 py-0 shrink-0">
              {tier}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{contact.title ?? 'Chưa có chức vụ'}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {days !== null && (
            <div className={`flex items-center gap-0.5 text-xs ${isOverdue ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
              <Clock size={11} />
              <span>{days}d</span>
            </div>
          )}
          <ChevronRight size={14} className="text-gray-300" />
        </div>
      </div>
    </Link>
  )
}
