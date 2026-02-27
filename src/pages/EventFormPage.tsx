import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X, Search } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useEvent, createEvent, updateEvent } from '@/hooks/useEvents'
import { useContacts } from '@/hooks/useContacts'
import { getContactDisplayName, getInitials } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tên sự kiện'),
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  endDate: z.string().optional(),
  location: z.string().optional(),
  description: z.string().optional(),
  outcome: z.string().optional(),
  nextSteps: z.string().optional(),
  followUpDate: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function EventFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  const event = useEvent(id ?? '')
  const allContacts = useContacts()

  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
  const [contactSearch, setContactSearch] = useState('')

  const filteredContacts = allContacts.filter(c => {
    if (!contactSearch) return true
    const q = contactSearch.toLowerCase()
    return getContactDisplayName(c).toLowerCase().includes(q) || c.email?.includes(q)
  })

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      date: new Date().toISOString().slice(0, 10),
      endDate: '',
      location: '',
      description: '',
      outcome: '',
      nextSteps: '',
      followUpDate: '',
    },
  })

  useEffect(() => {
    if (event) {
      reset({
        title: event.title,
        date: event.date,
        endDate: event.endDate ?? '',
        location: event.location ?? '',
        description: event.description ?? '',
        outcome: event.outcome ?? '',
        nextSteps: event.nextSteps ?? '',
        followUpDate: event.followUpDate ?? '',
      })
      setSelectedContactIds(event.contactIds)
    }
  }, [event, reset])

  function toggleContact(id: string) {
    setSelectedContactIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  async function onSubmit(data: FormData) {
    const eventData = {
      title: data.title,
      date: data.date,
      endDate: data.endDate || undefined,
      location: data.location || undefined,
      description: data.description || undefined,
      outcome: data.outcome || undefined,
      nextSteps: data.nextSteps || undefined,
      followUpDate: data.followUpDate || undefined,
      contactIds: selectedContactIds,
    }

    if (isEditing && id) {
      await updateEvent(id, eventData)
      navigate(`/events/${id}`, { replace: true })
    } else {
      const created = await createEvent(eventData)
      navigate(`/events/${created.id}`, { replace: true })
    }
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-semibold">{isEditing ? 'Sửa sự kiện' : 'Thêm sự kiện mới'}</h1>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} size="sm">
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>

      <form className="px-4 py-4 space-y-6 pb-8" onSubmit={handleSubmit(onSubmit)}>
        {/* Basic info */}
        <section className="space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Thông tin sự kiện</h2>

          <div className="space-y-1.5">
            <Label>Tên sự kiện *</Label>
            <Controller name="title" control={control} render={({ field }) => (
              <Input {...field} placeholder="TechSummit 2026, Workshop AI..." />
            )} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ngày bắt đầu *</Label>
              <Controller name="date" control={control} render={({ field }) => (
                <Input {...field} type="date" />
              )} />
            </div>
            <div className="space-y-1.5">
              <Label>Ngày kết thúc</Label>
              <Controller name="endDate" control={control} render={({ field }) => (
                <Input {...field} type="date" />
              )} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Địa điểm</Label>
            <Controller name="location" control={control} render={({ field }) => (
              <Input {...field} placeholder="Hà Nội, TP.HCM..." />
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Mô tả</Label>
            <Controller name="description" control={control} render={({ field }) => (
              <Textarea {...field} placeholder="Nội dung sự kiện..." rows={3} />
            )} />
          </div>
        </section>

        {/* Participants */}
        <section className="space-y-3">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Người tham gia ({selectedContactIds.length})
          </h2>

          {/* Selected */}
          {selectedContactIds.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedContactIds.map(cId => {
                const contact = allContacts.find(c => c.id === cId)
                if (!contact) return null
                return (
                  <Badge key={cId} variant="secondary" className="gap-1 py-1 pl-2 pr-1">
                    {getContactDisplayName(contact)}
                    <button type="button" onClick={() => toggleContact(cId)}>
                      <X size={12} />
                    </button>
                  </Badge>
                )
              })}
            </div>
          )}

          {/* Search & add */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              placeholder="Tìm liên hệ để thêm..."
              className="pl-8"
            />
          </div>

          {contactSearch && (
            <div className="max-h-40 overflow-auto space-y-1 border rounded-lg p-2">
              {filteredContacts.slice(0, 10).map(contact => {
                const selected = selectedContactIds.includes(contact.id)
                return (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => toggleContact(contact.id)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                      selected ? 'bg-primary/10 text-primary' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Avatar className="w-7 h-7 shrink-0">
                      <AvatarFallback className="text-[10px] bg-blue-50 dark:bg-blue-900/40 text-blue-700">
                        {getInitials(getContactDisplayName(contact))}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm flex-1 truncate">{getContactDisplayName(contact)}</span>
                    {selected && <span className="text-xs text-primary">✓</span>}
                  </button>
                )
              })}
              {filteredContacts.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-2">Không tìm thấy</p>
              )}
            </div>
          )}
        </section>

        {/* Outcome & Next steps */}
        <section className="space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Kết quả & Bước tiếp theo</h2>

          <div className="space-y-1.5">
            <Label>Kết quả sự kiện</Label>
            <Controller name="outcome" control={control} render={({ field }) => (
              <Textarea {...field} placeholder="Tóm tắt kết quả, điểm nổi bật..." rows={3} />
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Bước tiếp theo / Action items</Label>
            <Controller name="nextSteps" control={control} render={({ field }) => (
              <Textarea {...field} placeholder="- Gửi proposal cho A. Nguyễn&#10;- Follow-up với B. Trần..." rows={3} />
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Ngày follow-up</Label>
            <Controller name="followUpDate" control={control} render={({ field }) => (
              <Input {...field} type="date" />
            )} />
          </div>
        </section>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật sự kiện' : 'Thêm sự kiện'}
        </Button>
      </form>
    </div>
  )
}
