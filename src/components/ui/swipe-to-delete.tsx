import { useRef, useState } from 'react'
import type { ReactNode, TouchEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface SwipeToDeleteProps {
  onDelete: () => void
  label?: string  // Tên item để hiển thị trong toast
  children: ReactNode
}

const REVEAL_THRESHOLD = 40  // px tối thiểu để snap lộ nút xóa
const REVEAL_WIDTH = 72      // px chiều rộng của nút xóa
const UNDO_DELAY = 3000      // ms chờ trước khi xóa thật

export function SwipeToDelete({ onDelete, label, children }: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [sliding, setSliding] = useState(false)  // đang slide out chờ undo

  const startX = useRef(0)
  const startOffset = useRef(0)
  const isDragging = useRef(false)
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const undone = useRef(false)

  function onTouchStart(e: TouchEvent) {
    if (sliding) return
    startX.current = e.touches[0].clientX
    startOffset.current = offset
    isDragging.current = true
  }

  function onTouchMove(e: TouchEvent) {
    if (!isDragging.current || sliding) return
    const dx = e.touches[0].clientX - startX.current
    const next = startOffset.current + dx
    // Chỉ cho kéo trong phạm vi [-(REVEAL_WIDTH+20), 0]
    setOffset(Math.max(Math.min(next, 0), -(REVEAL_WIDTH + 20)))
  }

  function onTouchEnd() {
    isDragging.current = false
    if (sliding) return
    // Snap: nếu kéo đủ thì lộ nút, không thì về 0
    if (offset < -REVEAL_THRESHOLD) {
      setOffset(-REVEAL_WIDTH)
      setRevealed(true)
    } else {
      setOffset(0)
      setRevealed(false)
    }
  }

  function handleDeleteTap() {
    if (sliding) return
    if (pendingTimer.current) clearTimeout(pendingTimer.current)
    undone.current = false
    setRevealed(false)
    setSliding(true)
    setOffset(-500)  // Slide item ra khỏi màn hình

    toast(label ? `Đã xóa "${label}"` : 'Đã xóa', {
      duration: UNDO_DELAY,
      action: {
        label: 'Hoàn tác',
        onClick: () => {
          undone.current = true
          if (pendingTimer.current) clearTimeout(pendingTimer.current)
          setSliding(false)
          setOffset(0)
        },
      },
    })

    // Sau UNDO_DELAY xóa thật nếu không bấm hoàn tác
    pendingTimer.current = setTimeout(() => {
      if (!undone.current) onDelete()
    }, UNDO_DELAY)
  }

  function dismissReveal() {
    if (revealed && !sliding) {
      setOffset(0)
      setRevealed(false)
    }
  }

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Nút xóa — luôn ở bên phải, lộ ra khi content slide trái */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-red-500 rounded-r-xl"
        style={{ width: REVEAL_WIDTH }}
      >
        <button
          type="button"
          onClick={handleDeleteTap}
          className="flex items-center justify-center w-full h-full rounded-r-xl active:bg-red-600 transition-colors"
        >
          <Trash2 size={20} className="text-white" />
        </button>
      </div>

      {/* Overlay trong suốt: khi đang lộ nút, tap vào content để đóng lại */}
      {revealed && !sliding && (
        <div
          className="absolute inset-0 z-10"
          style={{ right: REVEAL_WIDTH }}
          onClick={dismissReveal}
        />
      )}

      {/* Content có thể vuốt */}
      <div
        style={{
          transform: `translateX(${offset}px)`,
          transition: isDragging.current ? 'none' : 'transform 0.25s ease',
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}
