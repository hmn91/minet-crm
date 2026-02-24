import { useState, useEffect } from 'react'
import { WifiOff, Download, RefreshCw, X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'

// ─── Offline indicator ────────────────────────────────────────────────────────

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const setOnline = () => setIsOffline(false)
    const setOffline = () => setIsOffline(true)
    window.addEventListener('online', setOnline)
    window.addEventListener('offline', setOffline)
    return () => {
      window.removeEventListener('online', setOnline)
      window.removeEventListener('offline', setOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-gray-800 text-white text-xs py-1.5 px-3">
      <WifiOff size={12} />
      <span>Đang offline — dữ liệu vẫn hoạt động bình thường</span>
    </div>
  )
}

// ─── PWA Update notification ──────────────────────────────────────────────────

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto bg-primary text-primary-foreground rounded-xl shadow-lg p-3 flex items-center gap-3">
      <RefreshCw size={16} className="shrink-0" />
      <p className="flex-1 text-sm">Có phiên bản mới. Cập nhật ngay?</p>
      <button
        onClick={() => updateServiceWorker(true)}
        className="text-xs font-semibold bg-white/20 hover:bg-white/30 px-2 py-1 rounded-md transition-colors"
      >
        Cập nhật
      </button>
      <button onClick={() => setNeedRefresh(false)} className="p-1 hover:bg-white/20 rounded">
        <X size={14} />
      </button>
    </div>
  )
}

// ─── Install prompt ───────────────────────────────────────────────────────────

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() =>
    localStorage.getItem('pwa-install-dismissed') === '1'
  )

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  async function handleInstall() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  function handleDismiss() {
    setDismissed(true)
    localStorage.setItem('pwa-install-dismissed', '1')
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto bg-card border rounded-xl shadow-lg p-3 flex items-center gap-3">
      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
        <Download size={18} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">Cài đặt MiNet CRM</p>
        <p className="text-xs text-muted-foreground">Dùng như app native trên điện thoại</p>
      </div>
      <button
        onClick={handleInstall}
        className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-md transition-colors shrink-0"
      >
        Cài đặt
      </button>
      <button onClick={handleDismiss} className="p-1 text-muted-foreground hover:text-foreground rounded shrink-0">
        <X size={14} />
      </button>
    </div>
  )
}
