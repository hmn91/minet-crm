import { useRef, useState } from 'react'
import type { ReactNode, TouchEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface SwipeToDeleteProps {
  onDelete: () => void
  label?: string  // Tên item để hiển thị trong toast
  children: ReactNode
}

const THRESHOLD = 80  // px kéo để trigger delete
const UNDO_DELAY = 2000  // ms chờ trước khi xóa thật

export function SwipeToDelete({ onDelete, label, children }: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const isDragging = useRef(false)
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undone = useRef(false)

  function onTouchStart(e: TouchEvent) {
    startX.current = e.touches[0].clientX
    isDragging.current = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging.current) return
    const dx = e.touches[0].clientX - startX.current
    // Chỉ cho kéo sang trái
    if (dx < 0) setOffset(Math.max(dx, -THRESHOLD - 20))
  }

  function onTouchEnd() {
    isDragging.current = false
    if (offset <= -THRESHOLD) {
      // Animate slide out
      setOffset(-300)
      undone.current = false

      // Show undo toast (2s)
      toast(label ? `Đã xóa "${label}"` : 'Đã xóa', {
        duration: UNDO_DELAY,
        action: {
          label: 'Hoàn tác',
          onClick: () => {
            undone.current = true
            if (pendingTimer.current) clearTimeout(pendingTimer.current)
            setOffset(0)
          },
        },
      })

      // Sau UNDO_DELAY, xóa thật nếu user không bấm hoàn tác
      pendingTimer.current = setTimeout(() => {
        if (!undone.current) onDelete()
      }, UNDO_DELAY)
    } else {
      setOffset(0)
    }
  }

  const showDelete = offset <= -THRESHOLD / 2

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Delete backdrop */}
      <div className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 rounded-xl transition-colors ${showDelete ? 'bg-red-500' : 'bg-red-200'}`}>
        <Trash2 size={18} className="text-white" />
      </div>
      {/* Content */}
      <div
        style={{ transform: `translateX(${offset}px)`, transition: isDragging.current ? 'none' : 'transform 0.2s ease' }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
