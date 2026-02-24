import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { ArrowLeft, Building2, Plus, Search, Trash2, Edit2, Users, Globe, Phone } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useCompanies, useCompany, createCompany, updateCompany, deleteCompany } from '@/hooks/useCompanies'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/db'
import type { Contact } from '@/types'

// ─── Company Form ─────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên công ty'),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  size: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

const SIZE_OPTIONS = ['1-10', '11-50', '51-200', '201-500', '500+']

function CompanyForm({ companyId, onClose }: { companyId?: string; onClose: () => void }) {
  const existing = useCompany(companyId)
  const isEdit = !!companyId

  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name: existing?.name ?? '',
      industry: existing?.industry ?? '',
      website: existing?.website ?? '',
      phone: existing?.phone ?? '',
      address: existing?.address ?? '',
      size: existing?.size ?? '',
      notes: existing?.notes ?? '',
    },
  })

  async function onSubmit(data: FormData) {
    const payload = {
      name: data.name,
      industry: data.industry || undefined,
      website: data.website || undefined,
      phone: data.phone || undefined,
      address: data.address || undefined,
      size: data.size || undefined,
      notes: data.notes || undefined,
    }
    if (isEdit && companyId) {
      await updateCompany(companyId, payload)
      toast.success('Đã cập nhật công ty')
    } else {
      await createCompany(payload)
      toast.success('Đã thêm công ty')
    }
    onClose()
  }

  return (
    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label>Tên công ty *</Label>
        <Controller name="name" control={control} render={({ field }) => (
          <Input {...field} placeholder="Công ty ABC" autoFocus />
        )} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label>Ngành nghề</Label>
        <Controller name="industry" control={control} render={({ field }) => (
          <Input {...field} placeholder="Công nghệ, Tài chính..." />
        )} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Website</Label>
          <Controller name="website" control={control} render={({ field }) => (
            <Input {...field} placeholder="https://..." />
          )} />
        </div>
        <div className="space-y-1.5">
          <Label>Điện thoại</Label>
          <Controller name="phone" control={control} render={({ field }) => (
            <Input {...field} placeholder="028..." />
          )} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Quy mô</Label>
        <div className="flex flex-wrap gap-2">
          <Controller name="size" control={control} render={({ field }) => (
            <>
              {SIZE_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => field.onChange(field.value === s ? '' : s)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    field.value === s
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </>
          )} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Địa chỉ</Label>
        <Controller name="address" control={control} render={({ field }) => (
          <Input {...field} placeholder="Số nhà, đường, quận, thành phố..." />
        )} />
      </div>
      <div className="space-y-1.5">
        <Label>Ghi chú</Label>
        <Controller name="notes" control={control} render={({ field }) => (
          <Textarea {...field} placeholder="Thông tin thêm..." rows={3} />
        )} />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose}>Hủy</Button>
        <Button className="flex-1" onClick={handleSubmit(onSubmit)} disabled={isSubmitting}>
          {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Thêm công ty'}
        </Button>
      </div>
    </div>
  )
}

// ─── Company Detail (Sheet-style within page) ─────────────────────────────────

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const company = useCompany(id)
  const contacts = useLiveQuery<Contact[]>(
    () => id ? db.contacts.where('companyId').equals(id).toArray() : Promise.resolve([]),
    [id]
  ) ?? []

  if (!company) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Không tìm thấy công ty</p>
      </div>
    )
  }

  async function handleDelete() {
    if (!id) return
    await deleteCompany(id)
    toast.success('Đã xóa công ty')
    navigate('/settings', { replace: true })
  }

  return (
    <div className="min-h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1"><ArrowLeft size={22} /></button>
        <h1 className="font-semibold truncate mx-2 flex-1">{company.name}</h1>
        <div className="flex gap-1">
          <button onClick={() => setEditOpen(true)} className="p-2 hover:bg-accent rounded-lg">
            <Edit2 size={18} />
          </button>
          <button onClick={() => setDeleteOpen(true)} className="p-2 hover:bg-accent rounded-lg text-destructive">
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Info */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Building2 size={24} className="text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-base">{company.name}</h2>
                {company.industry && <p className="text-sm text-muted-foreground">{company.industry}</p>}
                {company.size && <p className="text-xs text-muted-foreground">{company.size} nhân viên</p>}
              </div>
            </div>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline">
                <Globe size={15} />{company.website}
              </a>
            )}
            {company.phone && (
              <a href={`tel:${company.phone}`} className="flex items-center gap-2 text-sm">
                <Phone size={15} className="text-muted-foreground" />{company.phone}
              </a>
            )}
            {company.address && (
              <p className="text-sm text-muted-foreground">{company.address}</p>
            )}
            {company.notes && (
              <p className="text-sm border-t pt-3 mt-1">{company.notes}</p>
            )}
          </CardContent>
        </Card>

        {/* Contacts */}
        <div>
          <h3 className="font-semibold text-sm text-muted-foreground mb-2">
            LIÊN HỆ ({contacts.length})
          </h3>
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chưa có liên hệ nào</p>
          ) : (
            <div className="space-y-2">
              {contacts.map(c => (
                <Link key={c.id} to={`/contacts/${c.id}`}>
                  <Card className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                        {(c.firstName[0] ?? '') + (c.lastName[0] ?? '')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.lastName} {c.firstName}</p>
                        {c.title && <p className="text-xs text-muted-foreground truncate">{c.title}</p>}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                        c.tier === 'A' ? 'bg-red-100 text-red-700' :
                        c.tier === 'B' ? 'bg-orange-100 text-orange-700' :
                        c.tier === 'C' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{c.tier}</span>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa công ty</DialogTitle>
          </DialogHeader>
          <CompanyForm companyId={id} onClose={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa công ty?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Xóa <strong>{company.name}</strong>? Các liên hệ thuộc công ty này sẽ không bị xóa nhưng sẽ mất liên kết.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Companies List ────────────────────────────────────────────────────────────

export default function CompaniesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const companies = useCompanies(search)

  const contactCounts = useLiveQuery(async () => {
    const all = await db.contacts.toArray()
    const map: Record<string, number> = {}
    all.forEach(c => { if (c.companyId) map[c.companyId] = (map[c.companyId] ?? 0) + 1 })
    return map
  }) ?? {}

  return (
    <div className="min-h-full bg-background">
      <div className="px-4 pt-4 pb-3 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1"><ArrowLeft size={20} /></button>
            <h1 className="text-xl font-bold">Công ty ({companies.length})</h1>
          </div>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus size={16} className="mr-1" />Thêm
          </Button>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm công ty..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-2 pb-8">
        {companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 size={40} className="text-gray-200 mb-3" />
            <p className="text-muted-foreground text-sm">
              {search ? 'Không tìm thấy công ty nào' : 'Chưa có công ty nào'}
            </p>
            {!search && (
              <Button variant="outline" className="mt-4" onClick={() => setAddOpen(true)}>
                <Plus size={16} className="mr-1" />Thêm công ty đầu tiên
              </Button>
            )}
          </div>
        ) : (
          companies.map(c => (
            <Link key={c.id} to={`/companies/${c.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.name}</p>
                    {c.industry && <p className="text-xs text-muted-foreground truncate">{c.industry}</p>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                    <Users size={12} />
                    <span>{contactCounts[c.id] ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm công ty</DialogTitle>
          </DialogHeader>
          <CompanyForm onClose={() => setAddOpen(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
