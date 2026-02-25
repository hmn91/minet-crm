import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCircle2 } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { SwipeToDelete } from '@/components/ui/swipe-to-delete'
import { useLiveQuery } from 'dexie-react-hooks'
import { useReminders, createReminder, completeReminder, deleteReminder } from '@/hooks/useReminders'
import { db } from '@/lib/db'
import { getContactDisplayName, formatDateTime } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  dueDate: z.string().min(1, 'Vui lòng chọn thời gian'),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function RemindersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contactId = searchParams.get('contactId')
  const reminders = useReminders()

  const contactNames = useLiveQuery(async () => {
    const map: Record<string, string> = {}
    const contacts = await db.contacts.toArray()
    contacts.forEach(c => { map[c.id] = getContactDisplayName(c) })
    return map
  }) ?? {}

  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      dueDate: '',
      notes: '',
    },
  })

  async function onSubmit(data: FormData) {
    if (!contactId) return
    await createReminder({
      contactId,
      title: data.title,
      dueDate: new Date(data.dueDate).toISOString(),
      notes: data.notes || undefined,
    })
    navigate(-1)
  }

  // Form mode (creating new reminder)
  if (window.location.pathname.includes('/new') && contactId) {
    return (
      <div className="min-h-full bg-background">
        <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
          <button onClick={() => navigate(-1)} className="p-1 -ml-1">
            <ArrowLeft size={22} />
          </button>
          <h1 className="font-semibold">Thêm nhắc nhở</h1>
          <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
            Lưu
          </Button>
        </div>
        <form className="px-4 py-4 space-y-5 pb-8">
          <div className="space-y-1.5">
            <Label>Tiêu đề *</Label>
            <Controller name="title" control={control} render={({ field }) => (
              <Input {...field} placeholder="Liên hệ follow-up, Gửi tài liệu..." autoFocus />
            )} />
            {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Thời gian nhắc *</Label>
            <Controller name="dueDate" control={control} render={({ field }) => (
              <Input {...field} type="datetime-local" />
            )} />
            {errors.dueDate && <p className="text-xs text-red-500">{errors.dueDate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Ghi chú</Label>
            <Controller name="notes" control={control} render={({ field }) => (
              <Textarea {...field} placeholder="Ghi chú thêm..." rows={3} />
            )} />
          </div>
          <Button type="submit" className="w-full" size="lg">Thêm nhắc nhở</Button>
        </form>
      </div>
    )
  }

  // List mode
  return (
    <div className="min-h-full bg-background">
      <div className="px-4 pt-4 pb-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Nhắc nhở ({reminders.length})</h1>
        </div>
      </div>
      <div className="px-4 py-4 space-y-3 pb-8">
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell size={40} className="text-gray-200 mb-3" />
            <p className="text-muted-foreground text-sm">Chưa có nhắc nhở nào</p>
          </div>
        ) : (
          reminders.map(r => (
            <SwipeToDelete key={r.id} onDelete={() => deleteReminder(r.id)}>
              <Card>
                <CardContent className="p-3 flex items-start gap-3">
                  <button
                    onClick={() => completeReminder(r.id)}
                    className="mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 flex items-center justify-center transition-colors"
                  >
                    <CheckCircle2 size={14} className="text-transparent hover:text-green-500" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{r.title}</p>
                    {contactNames[r.contactId] && (
                      <p className="text-xs text-primary">{contactNames[r.contactId]}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.dueDate)}</p>
                    {r.notes && <p className="text-xs text-gray-600 mt-1">{r.notes}</p>}
                  </div>
                </CardContent>
              </Card>
            </SwipeToDelete>
          ))
        )}
      </div>
    </div>
  )
}
