import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createInteraction } from '@/hooks/useInteractions'
import type { InteractionType } from '@/types'
import { INTERACTION_TYPE_LABELS } from '@/types'
import { now } from '@/lib/utils'

const schema = z.object({
  type: z.enum(['meeting', 'call', 'email', 'message', 'event', 'other']),
  date: z.string().min(1),
  notes: z.string().optional(),
  outcome: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function InteractionFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const contactId = searchParams.get('contactId') ?? ''

  const { control, handleSubmit, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'meeting',
      date: now().slice(0, 16),
      notes: '',
      outcome: '',
    },
  })

  async function onSubmit(data: FormData) {
    await createInteraction({
      contactId,
      type: data.type,
      date: new Date(data.date).toISOString(),
      notes: data.notes || undefined,
      outcome: data.outcome || undefined,
    })
    navigate(-1)
  }

  return (
    <div className="min-h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold">Ghi nhật ký tương tác</h1>
        <Button size="sm" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-4 space-y-5 pb-8">
        <div className="space-y-1.5">
          <Label>Loại tương tác</Label>
          <Controller name="type" control={control} render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.entries(INTERACTION_TYPE_LABELS) as [InteractionType, string][]).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )} />
        </div>

        <div className="space-y-1.5">
          <Label>Thời gian</Label>
          <Controller name="date" control={control} render={({ field }) => (
            <Input {...field} type="datetime-local" />
          )} />
        </div>

        <div className="space-y-1.5">
          <Label>Ghi chú</Label>
          <Controller name="notes" control={control} render={({ field }) => (
            <Textarea {...field} placeholder="Nội dung cuộc trò chuyện..." rows={3} />
          )} />
        </div>

        <div className="space-y-1.5">
          <Label>Kết quả</Label>
          <Controller name="outcome" control={control} render={({ field }) => (
            <Textarea {...field} placeholder="Kết quả đạt được, quyết định..." rows={2} />
          )} />
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          Lưu tương tác
        </Button>
      </form>
    </div>
  )
}
