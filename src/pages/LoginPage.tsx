import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, LogIn, ArrowRight, Loader2, RotateCcw, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getUserProfile, saveUserProfile, getAllSettings, clearCRMData, hasCRMData } from '@/lib/db'
import { initGoogleAuth, signInWithGoogle } from '@/lib/auth'
import { now } from '@/lib/utils'
import type { UserProfile } from '@/types'

// Pending info during restore decision
type PendingGoogle = { accessToken: string; userInfo: { id: string; name: string; email: string; picture: string } }
type PendingLocal = { displayName: string }

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuthenticated, setUserProfile, setGoogleAccessToken } = useAuthStore()
  const { update: updateSettings } = useSettingsStore()

  const [isLoading, setIsLoading] = useState(false)
  const [showManual, setShowManual] = useState(false)
  const [manualName, setManualName] = useState('')
  const [error, setError] = useState('')

  // Restore state
  const [storedProfile, setStoredProfile] = useState<UserProfile | null>(null)
  const [hasData, setHasData] = useState(false)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [pendingGoogle, setPendingGoogle] = useState<PendingGoogle | null>(null)
  const [pendingLocal, setPendingLocal] = useState<PendingLocal | null>(null)

  useEffect(() => {
    // Load GIS script
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => initGoogleAuth()
    document.head.appendChild(script)
    return () => {
      document.head.removeChild(script)
    }
  }, [])

  // Check returning user
  useEffect(() => {
    async function checkReturnUser() {
      const [profile, settings] = await Promise.all([getUserProfile(), getAllSettings()])
      if (!profile) return
      if (settings.pendingLogin) {
        // User soft-logged-out — wait for restore decision
        const dataExists = await hasCRMData()
        setStoredProfile(profile)
        setHasData(dataExists)
      } else {
        // Normal returning user — auto-login
        setUserProfile(profile)
        setAuthenticated(true)
        navigate('/', { replace: true })
      }
    }
    void checkReturnUser()
  }, [navigate, setAuthenticated, setUserProfile])

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function completeLogin(profile: UserProfile, googleToken?: string) {
    saveUserProfile(profile)
    setUserProfile(profile)
    if (googleToken) setGoogleAccessToken(googleToken)
    setAuthenticated(true)
    navigate('/', { replace: true })
  }

  async function clearPendingAndProceed() {
    await updateSettings({ pendingLogin: false })
  }

  // ─── Google login ──────────────────────────────────────────────────────────

  async function handleGoogleLogin() {
    setIsLoading(true)
    setError('')
    try {
      const { accessToken, userInfo } = await signInWithGoogle()

      // Check if same account as soft-logged-out session with data
      if (storedProfile && storedProfile.googleId === userInfo.id && hasData) {
        setPendingGoogle({ accessToken, userInfo })
        setShowRestoreDialog(true)
        return
      }

      // Different account or no pending data — login normally
      await clearPendingAndProceed()
      completeLogin({
        id: 'current-user',
        googleId: userInfo.id,
        displayName: userInfo.name,
        email: userInfo.email,
        avatarUrl: userInfo.picture,
        updatedAt: now(),
      }, accessToken)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  // ─── Local login ──────────────────────────────────────────────────────────

  async function handleManualLogin() {
    const name = manualName.trim()
    if (!name) return

    // Check if same name as soft-logged-out session with data
    if (storedProfile && !storedProfile.googleId &&
        storedProfile.displayName.trim().toLowerCase() === name.toLowerCase() && hasData) {
      setPendingLocal({ displayName: name })
      setShowRestoreDialog(true)
      return
    }

    await clearPendingAndProceed()
    completeLogin({ id: 'current-user', displayName: name, updatedAt: now() })
  }

  // ─── Restore dialog actions ────────────────────────────────────────────────

  async function handleRestore() {
    await clearPendingAndProceed()
    if (pendingGoogle) {
      completeLogin({
        id: 'current-user',
        googleId: pendingGoogle.userInfo.id,
        displayName: pendingGoogle.userInfo.name,
        email: pendingGoogle.userInfo.email,
        avatarUrl: pendingGoogle.userInfo.picture,
        updatedAt: now(),
      }, pendingGoogle.accessToken)
    } else if (pendingLocal) {
      // Keep existing storedProfile data, just re-authenticate
      completeLogin({ ...storedProfile!, displayName: pendingLocal.displayName, updatedAt: now() })
    }
    setShowRestoreDialog(false)
  }

  async function handleStartFresh() {
    await clearCRMData()
    await clearPendingAndProceed()
    if (pendingGoogle) {
      completeLogin({
        id: 'current-user',
        googleId: pendingGoogle.userInfo.id,
        displayName: pendingGoogle.userInfo.name,
        email: pendingGoogle.userInfo.email,
        avatarUrl: pendingGoogle.userInfo.picture,
        updatedAt: now(),
      }, pendingGoogle.accessToken)
    } else if (pendingLocal) {
      completeLogin({ id: 'current-user', displayName: pendingLocal.displayName, updatedAt: now() })
    }
    setShowRestoreDialog(false)
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 dark:from-blue-900/40 to-white dark:to-gray-800 px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center mb-10">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <span className="text-white font-bold text-3xl">M</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">MiNet CRM</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-center text-sm">
          Quản lý quan hệ nhân sự chuyên nghiệp
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-4">
        {!showManual ? (
          <>
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              size="xl"
              className="w-full bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm gap-3"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <GoogleIcon />
              )}
              Đăng nhập với Google
            </Button>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white dark:bg-gray-800 px-3 text-gray-400 dark:text-gray-500">hoặc</span>
              </div>
            </div>

            <Button
              onClick={() => setShowManual(true)}
              variant="ghost"
              className="w-full text-gray-600 dark:text-gray-400 gap-2"
            >
              Tiếp tục không đăng nhập
              <ArrowRight size={16} />
            </Button>
          </>
        ) : (
          <>
            <button
              onClick={() => setShowManual(false)}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1 mb-2"
            >
              ← Quay lại
            </button>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Nhập tên của bạn</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Tên hiển thị</Label>
              <Input
                id="name"
                placeholder="Nguyễn Văn A"
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleManualLogin()}
                autoFocus
              />
            </div>
            <Button
              onClick={handleManualLogin}
              disabled={!manualName.trim()}
              className="w-full"
              size="lg"
            >
              <LogIn size={18} />
              Bắt đầu sử dụng
            </Button>
          </>
        )}
      </div>

      {/* Privacy note */}
      <div className="mt-8 flex items-center gap-2 text-gray-400 dark:text-gray-500 text-xs text-center">
        <Shield size={14} className="shrink-0" />
        <span>Dữ liệu lưu hoàn toàn trên thiết bị của bạn. Không có server.</span>
      </div>

      {/* Restore dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tìm thấy dữ liệu cũ</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tài khoản <strong className="text-foreground">
              {pendingGoogle?.userInfo.name ?? pendingLocal?.displayName}
            </strong> có dữ liệu CRM chưa xóa trên thiết bị này. Bạn muốn làm gì?
          </p>
          <div className="flex flex-col gap-3 mt-2">
            <Button className="gap-2 justify-start" onClick={handleRestore}>
              <RotateCcw size={16} />
              <div className="text-left">
                <div className="font-medium">Khôi phục dữ liệu cũ</div>
                <div className="text-xs font-normal opacity-80">Tiếp tục với toàn bộ liên hệ, sự kiện đã có</div>
              </div>
            </Button>
            <Button variant="outline" className="gap-2 justify-start" onClick={handleStartFresh}>
              <PlusCircle size={16} />
              <div className="text-left">
                <div className="font-medium">Bắt đầu mới</div>
                <div className="text-xs font-normal opacity-80">Xóa dữ liệu cũ và tạo danh sách trống</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}
