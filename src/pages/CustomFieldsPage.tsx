import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { useCustomFieldDefs, createCustomFieldDef, deleteCustomFieldDef } from '@/hooks/useCustomFields'
import { PRESET_CUSTOM_FIELDS } from '@/types'
import type { CustomFieldType, CustomFieldCategory } from '@/types'


const TYPE_LABELS: Record<CustomFieldType, string> = {
  text: 'Văn bản', url: 'URL', number: 'Số', date: 'Ngày', textarea: 'Đoạn văn', phone: 'Điện thoại',
}
const CAT_LABELS: Record<CustomFieldCategory, string> = {
  social: 'Mạng xã hội', personal: 'Cá nhân', work: 'Công việc', other: 'Khác',
}

export default function CustomFieldsPage() {
  const navigate = useNavigate()
  const defs = useCustomFieldDefs()
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newType, setNewType] = useState<CustomFieldType>('text')
  const [newCategory, setNewCategory] = useState<CustomFieldCategory>('other')
  const [newPlaceholder, setNewPlaceholder] = useState('')
  const [newRequired, setNewRequired] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [deleteData, setDeleteData] = useState(false)

  async function handleAdd() {
    if (!newName.trim()) return
    await createCustomFieldDef({
      name: newName.trim(),
      type: newType,
      category: newCategory,
      isRequired: newRequired,
      placeholder: newPlaceholder || undefined,
    })
    setShowAdd(false)
    setNewName('')
    setNewType('text')
    setNewCategory('other')
    setNewPlaceholder('')
    setNewRequired(false)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteCustomFieldDef(deleteTarget, deleteData)
    setDeleteTarget(null)
    setDeleteData(false)
  }

  async function addPreset(preset: typeof PRESET_CUSTOM_FIELDS[number]) {
    const exists = defs.find(d => d.name === preset.name)
    if (exists) return
    await createCustomFieldDef({
      name: preset.name,
      type: preset.type,
      category: preset.category,
      isRequired: false,
      placeholder: preset.placeholder,
      icon: preset.icon,
    })
  }

  const byCategory = Object.keys(CAT_LABELS).map(cat => ({
    cat: cat as CustomFieldCategory,
    fields: defs.filter(d => d.category === cat),
  })).filter(g => g.fields.length > 0)

  const presetNotAdded = PRESET_CUSTOM_FIELDS.filter(p => !defs.find(d => d.name === p.name))

  return (
    <div className="min-h-full bg-background">
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-semibold">Trường tùy chỉnh</h1>
        <Button size="sm" onClick={() => setShowAdd(true)} className="gap-1.5">
          <Plus size={16} />
          Thêm
        </Button>
      </div>

      <div className="px-4 py-4 space-y-6 pb-8">
        {/* Existing fields */}
        {byCategory.map(({ cat, fields }) => (
          <section key={cat}>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {CAT_LABELS[cat]}
            </h2>
            <div className="space-y-2">
              {fields.map(def => (
                <div key={def.id} className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl border">
                  <GripVertical size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{def.name}</span>
                      {def.isRequired && <Badge variant="outline" className="text-[10px]">Bắt buộc</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{TYPE_LABELS[def.type]}</p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(def.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-lg transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}

        {defs.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Chưa có trường tùy chỉnh nào
          </div>
        )}

        {/* Presets */}
        {presetNotAdded.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">Gợi ý thêm nhanh</h2>
            <div className="flex flex-wrap gap-2">
              {presetNotAdded.map(preset => (
                <button
                  key={preset.name}
                  onClick={() => addPreset(preset)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus size={13} />
                  {preset.name}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Thêm trường tùy chỉnh</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tên trường *</Label>
              <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Facebook, Địa chỉ nhà..." autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Kiểu dữ liệu</Label>
                <Select value={newType} onValueChange={v => setNewType(v as CustomFieldType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(TYPE_LABELS) as [CustomFieldType, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Danh mục</Label>
                <Select value={newCategory} onValueChange={v => setNewCategory(v as CustomFieldCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.entries(CAT_LABELS) as [CustomFieldCategory, string][]).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Placeholder</Label>
              <Input value={newPlaceholder} onChange={e => setNewPlaceholder(e.target.value)} placeholder="Gợi ý nhập liệu..." />
            </div>
            <div className="flex items-center justify-between">
              <Label>Bắt buộc nhập</Label>
              <Switch checked={newRequired} onCheckedChange={setNewRequired} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowAdd(false)}>Hủy</Button>
            <Button onClick={handleAdd} disabled={!newName.trim()}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa trường này?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Bạn muốn làm gì với dữ liệu đã nhập trong trường này?</p>
            <div className="flex items-center gap-2">
              <Switch checked={deleteData} onCheckedChange={setDeleteData} />
              <span className="text-sm">Xóa cả dữ liệu đã nhập</span>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
            <Button variant="destructive" onClick={handleDelete}>Xóa trường</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
