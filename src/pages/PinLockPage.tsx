import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, Fingerprint } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { verifyPIN } from '@/lib/crypto'
import { authenticateBiometric, isBiometricSupported } from '@/lib/crypto'
import { getInitials } from '@/lib/utils'

const PIN_LENGTH = 6
const MAX_ATTEMPTS = 5

export default function PinLockPage() {
  const navigate = useNavigate()
  const { userProfile, setPinLocked } = useAuthStore()
  const { settings } = useSettingsStore()
  const [pin, setPin] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [error, setError] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockUntil, setLockUntil] = useState<number | null>(null)

  // If biometric is available, show biometric UI first; PIN is a fallback
  const biometricAvailable = useMemo(
    () => settings.biometricEnabled && !!settings.biometricCredentialId && isBiometricSupported(),
    [settings.biometricEnabled, settings.biometricCredentialId]
  )
  const [showPin, setShowPin] = useState(!biometricAvailable)

  const displayName = userProfile?.displayName ?? 'Người dùng'
  const avatarUrl = userProfile?.customAvatarBase64 ?? userProfile?.avatarUrl

  const handleUnlock = useCallback(async (inputPin: string) => {
    if (!settings.pinHash) return
    const ok = await verifyPIN(inputPin, settings.pinHash)
    if (ok) {
      setPinLocked(false)
      navigate('/', { replace: true })
    } else {
      const newAttempts = attempts + 1
      setAttempts(newAttempts)
      setPin('')
      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + 30 * 1000 // 30 seconds lockout
        setLockUntil(until)
        setIsLocked(true)
        setError('Quá nhiều lần thử sai. Chờ 30 giây.')
      } else {
        setError(`Mã PIN sai. Còn ${MAX_ATTEMPTS - newAttempts} lần thử.`)
      }
    }
  }, [attempts, navigate, settings.pinHash, setPinLocked])

  const handleDigit = useCallback((digit: string) => {
    if (isLocked) return
    const next = pin + digit
    if (next.length <= PIN_LENGTH) {
      setPin(next)
      setError('')
      if (next.length === PIN_LENGTH) {
        handleUnlock(next)
      }
    }
  }, [pin, isLocked, handleUnlock])

  const handleDelete = useCallback(() => {
    setPin(prev => prev.slice(0, -1))
    setError('')
  }, [])

  const handleBiometric = useCallback(async () => {
    if (!settings.biometricCredentialId) return
    const ok = await authenticateBiometric(settings.biometricCredentialId)
    if (ok) {
      setPinLocked(false)
      navigate('/', { replace: true })
    } else {
      setError('Xác thực sinh trắc học thất bại.')
    }
  }, [settings.biometricCredentialId, navigate, setPinLocked])

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleDigit(e.key)
      if (e.key === 'Backspace') handleDelete()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDigit, handleDelete])

  // Lockout timer
  useEffect(() => {
    if (!isLocked || !lockUntil) return
    const interval = setInterval(() => {
      if (Date.now() >= lockUntil) {
        setIsLocked(false)
        setAttempts(0)
        setLockUntil(null)
        setError('')
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [isLocked, lockUntil])

  // Auto biometric on mount
  useEffect(() => {
    if (settings.biometricEnabled && settings.biometricCredentialId && isBiometricSupported()) {
      setTimeout(handleBiometric, 500)
    }
  }, []) // eslint-disable-line

  const dots = Array.from({ length: PIN_LENGTH }, (_, i) => i < pin.length)
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      {/* Avatar & name */}
      <div className="flex flex-col items-center mb-10">
        <Avatar className="w-20 h-20 mb-3">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={displayName} />
          ) : (
            <AvatarFallback className="text-xl bg-primary text-primary-foreground">
              {getInitials(displayName)}
            </AvatarFallback>
          )}
        </Avatar>
        <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Xin chào, {displayName.split(' ')[0]}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {biometricAvailable && !showPin
            ? 'Dùng vân tay / Face ID để mở khóa'
            : 'Nhập mã PIN để mở khóa'}
        </p>
      </div>

      {/* Biometric primary UI */}
      {biometricAvailable && !showPin ? (
        <>
          <Button
            variant="outline"
            className="w-40 h-40 rounded-full flex flex-col gap-3 text-primary border-2 border-primary/30 hover:border-primary mb-6"
            onClick={handleBiometric}
          >
            <Fingerprint size={52} />
            <span className="text-sm font-medium">Chạm để xác thực</span>
          </Button>

          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          {settings.pinEnabled && (
            <Button variant="ghost" className="mt-2 text-muted-foreground text-sm" onClick={() => setShowPin(true)}>
              Dùng mã PIN thay thế
            </Button>
          )}
        </>
      ) : (
        <>
          {/* PIN dots */}
          <div className="flex gap-4 mb-8">
            {dots.map((filled, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  filled ? 'bg-primary border-primary scale-110' : 'border-gray-300 dark:border-gray-600'
                }`}
              />
            ))}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
          )}

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
            {digits.map((d, i) => {
              if (d === '') return <div key={i} />
              if (d === 'del') {
                return (
                  <button
                    key={i}
                    onClick={handleDelete}
                    className="flex items-center justify-center h-16 rounded-2xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all"
                  >
                    <Delete size={22} />
                  </button>
                )
              }
              return (
                <button
                  key={i}
                  onClick={() => handleDigit(d)}
                  disabled={isLocked}
                  className="flex items-center justify-center h-16 rounded-2xl text-2xl font-medium text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all disabled:opacity-40 select-none"
                >
                  {d}
                </button>
              )
            })}
          </div>

          {/* Switch back to biometric */}
          {biometricAvailable && (
            <Button
              variant="ghost"
              className="mt-6 text-primary gap-2"
              onClick={() => { setShowPin(false); setError('') }}
            >
              <Fingerprint size={22} />
              Dùng vân tay / Face ID
            </Button>
          )}
        </>
      )}
    </div>
  )
}
