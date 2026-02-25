import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useContact, createContact, updateContact } from '@/hooks/useContacts'
import { useCompanies, createCompany } from '@/hooks/useCompanies'
import { useCustomFieldDefs } from '@/hooks/useCustomFields'
import type { Tier, RelationshipType } from '@/types'
import { RELATIONSHIP_TYPE_LABELS } from '@/types'

const schema = z.object({
  firstName: z.string().min(1, 'Vui lòng nhập tên'),
  lastName: z.string().min(1, 'Vui lòng nhập họ'),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyId: z.string().optional(),
  newCompanyName: z.string().optional(),
  title: z.string().optional(),
  tier: z.enum(['A', 'B', 'C', 'D']),
  relationshipType: z.enum(['customer', 'partner', 'investor', 'vendor', 'other']),
  linkedIn: z.string().optional(),
  birthday: z.string().optional(),
  nextFollowUpAt: z.string().optional(),
  notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export default function ContactFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEditing = !!id
  const contact = useContact(id ?? '')
  const companies = useCompanies()
  const customFieldDefs = useCustomFieldDefs()

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [companyMode, setCompanyMode] = useState<'select' | 'new'>('select')

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      title: '',
      tier: 'B',
      relationshipType: 'other',
      linkedIn: '',
      birthday: '',
      nextFollowUpAt: '',
      notes: '',
    },
  })

  useEffect(() => {
    if (contact) {
      reset({
        firstName: contact.firstName,
        lastName: contact.lastName,
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        companyId: contact.companyId ?? '__none__',
        title: contact.title ?? '',
        tier: contact.tier,
        relationshipType: contact.relationshipType,
        linkedIn: contact.linkedIn ?? '',
        birthday: contact.birthday ?? '',
        nextFollowUpAt: contact.nextFollowUpAt?.slice(0, 10) ?? '',
        notes: contact.notes ?? '',
      })
      setTags(contact.tags)
      setCustomValues(contact.customFields)
    }
  }, [contact, reset])

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags(prev => [...prev, t])
    }
    setTagInput('')
  }

  async function onSubmit(data: FormData) {
    let companyId = data.companyId

    if (companyMode === 'new' && data.newCompanyName?.trim()) {
      const company = await createCompany({
        name: data.newCompanyName.trim(),
      })
      companyId = company.id
    }

    const contactData = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || undefined,
      phone: data.phone || undefined,
      companyId: (companyId && companyId !== '__none__') ? companyId : undefined,
      title: data.title || undefined,
      tier: data.tier,
      relationshipType: data.relationshipType,
      linkedIn: data.linkedIn || undefined,
      birthday: data.birthday || undefined,
      nextFollowUpAt: data.nextFollowUpAt ? new Date(data.nextFollowUpAt).toISOString() : undefined,
      notes: data.notes || undefined,
      tags,
      customFields: customValues,
    }

    if (isEditing && id) {
      await updateContact(id, contactData)
      navigate(`/contacts/${id}`, { replace: true })
    } else {
      const created = await createContact(contactData)
      navigate(`/contacts/${created.id}`, { replace: true })
    }
  }

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <h1 className="font-semibold">{isEditing ? 'Sửa liên hệ' : 'Thêm liên hệ mới'}</h1>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} size="sm">
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>

      <form className="px-4 py-4 space-y-6 pb-8">
        {/* Basic info */}
        <section className="space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Thông tin cơ bản</h2>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Họ *</Label>
              <Controller name="lastName" control={control} render={({ field }) => (
                <Input {...field} placeholder="Nguyễn" />
              )} />
              {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Tên *</Label>
              <Controller name="firstName" control={control} render={({ field }) => (
                <Input {...field} placeholder="Văn A" />
              )} />
              {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Chức vụ</Label>
            <Controller name="title" control={control} render={({ field }) => (
              <Input {...field} placeholder="CEO, CTO, Sales Manager..." />
            )} />
          </div>

          {/* Company */}
          <div className="space-y-1.5">
            <Label>Công ty</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCompanyMode('select')}
                className={`text-xs px-3 py-1 rounded-full border ${companyMode === 'select' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}
              >
                Chọn có sẵn
              </button>
              <button
                type="button"
                onClick={() => setCompanyMode('new')}
                className={`text-xs px-3 py-1 rounded-full border ${companyMode === 'new' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}
              >
                Tạo mới
              </button>
            </div>
            {companyMode === 'select' ? (
              <Controller name="companyId" control={control} render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue placeholder="Chọn công ty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Không có</SelectItem>
                    {companies.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )} />
            ) : (
              <Controller name="newCompanyName" control={control} render={({ field }) => (
                <Input {...field} placeholder="Tên công ty mới" />
              )} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Controller name="email" control={control} render={({ field }) => (
                <Input {...field} type="email" placeholder="email@company.com" />
              )} />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Điện thoại</Label>
              <Controller name="phone" control={control} render={({ field }) => (
                <Input {...field} type="tel" placeholder="0901234567" />
              )} />
            </div>
          </div>
        </section>

        {/* Classification */}
        <section className="space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Phân loại</h2>

          <div className="space-y-1.5">
            <Label>Tier (Mức độ ưu tiên)</Label>
            <Controller name="tier" control={control} render={({ field }) => (
              <div className="flex gap-2">
                {(['A', 'B', 'C', 'D'] as Tier[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => field.onChange(t)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      field.value === t
                        ? t === 'A' ? 'bg-red-500 text-white border-red-500'
                          : t === 'B' ? 'bg-orange-500 text-white border-orange-500'
                          : t === 'C' ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'bg-gray-500 text-white border-gray-500'
                        : 'bg-white text-gray-600 border-gray-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Loại quan hệ</Label>
            <Controller name="relationshipType" control={control} render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(RELATIONSHIP_TYPE_LABELS) as [RelationshipType, string][]).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )} />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Nhập tag..."
                className="flex-1"
              />
              <Button type="button" variant="outline" size="sm" onClick={addTag}>
                <Plus size={16} />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button type="button" onClick={() => setTags(tags.filter(t => t !== tag))}>
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Custom fields */}
        {customFieldDefs.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Thông tin tùy chỉnh</h2>
            {customFieldDefs.map(def => (
              <div key={def.id} className="space-y-1.5">
                <Label>{def.name}{def.isRequired && ' *'}</Label>
                {def.type === 'textarea' ? (
                  <Textarea
                    value={customValues[def.id] ?? ''}
                    onChange={e => setCustomValues(prev => ({ ...prev, [def.id]: e.target.value }))}
                    placeholder={def.placeholder}
                    rows={2}
                  />
                ) : (
                  <Input
                    type={def.type === 'url' ? 'url' : def.type === 'phone' ? 'tel' : def.type === 'number' ? 'number' : def.type === 'date' ? 'date' : 'text'}
                    value={customValues[def.id] ?? ''}
                    onChange={e => setCustomValues(prev => ({ ...prev, [def.id]: e.target.value }))}
                    placeholder={def.placeholder}
                  />
                )}
              </div>
            ))}
          </section>
        )}

        {/* Reminders */}
        <section className="space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Nhắc nhở</h2>

          <div className="space-y-1.5">
            <Label>Liên hệ lại vào ngày</Label>
            <Controller name="nextFollowUpAt" control={control} render={({ field }) => (
              <Input {...field} type="date" />
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Sinh nhật</Label>
            <Controller name="birthday" control={control} render={({ field }) => (
              <Input {...field} type="date" />
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>LinkedIn</Label>
            <Controller name="linkedIn" control={control} render={({ field }) => (
              <Input {...field} type="url" placeholder="https://linkedin.com/in/..." />
            )} />
          </div>
        </section>

        {/* Notes */}
        <section className="space-y-4">
          <h2 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Ghi chú</h2>
          <Controller name="notes" control={control} render={({ field }) => (
            <Textarea {...field} placeholder="Ghi chú về liên hệ này..." rows={4} />
          )} />
        </section>

        <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : isEditing ? 'Cập nhật liên hệ' : 'Thêm liên hệ'}
        </Button>
      </form>
    </div>
  )
}
