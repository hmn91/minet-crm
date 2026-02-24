import { useRef, useState } from 'react'
import type { ReactNode, TouchEvent } from 'react'
import { Trash2 } from 'lucide-react'

interface SwipeToDeleteProps {
  onDelete: () => void
  children: ReactNode
}

const THRESHOLD = 80  // px kéo để trigger delete

export function SwipeToDelete({ onDelete, children }: SwipeToDeleteProps) {
  const [offset, setOffset] = useState(0)
  const startX = useRef(0)
  const isDragging = useRef(false)

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
      // Confirm delete: animate out then call
      setOffset(-300)
      setTimeout(onDelete, 200)
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
