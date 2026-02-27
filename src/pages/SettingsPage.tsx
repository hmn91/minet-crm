import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, CloudUpload, Bell, Moon, Trash2, Info, ChevronRight, Loader2, Download, Upload, Check } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { hashPIN, registerBiometric, isBiometricSupported } from '@/lib/crypto'
import { backupToLocalFile, restoreFromLocalFile, backupToGoogleDrive, listDriveBackups, restoreFromGoogleDrive } from '@/lib/backup'
import { requestDriveAccess } from '@/lib/auth'
import { requestNotificationPermission } from '@/lib/notifications'
import { clearAllData } from '@/lib/db'
import { getInitials } from '@/lib/utils'

export default function SettingsPage() {
  const { userProfile, setAuthenticated } = useAuthStore()
  const { settings, update } = useSettingsStore()
  const [showPinSetup, setShowPinSetup] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter')
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [backupStatus, setBackupStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [backupMessage, setBackupMessage] = useState('')
  const [driveFiles, setDriveFiles] = useState<{id: string; name: string; createdTime: string}[]>([])
  const [showDriveList, setShowDriveList] = useState(false)

  const avatarUrl = userProfile?.customAvatarBase64 ?? userProfile?.avatarUrl
  const displayName = userProfile?.displayName ?? 'Người dùng'

  async function handleEnablePin() {
    setPinInput('')
    setPinConfirm('')
    setPinStep('enter')
    setShowPinSetup(true)
  }

  async function handlePinDigit(digit: string) {
    if (pinStep === 'enter') {
      const next = pinInput + digit
      setPinInput(next)
      if (next.length === 6) {
        setPinStep('confirm')
        setPinConfirm('')
      }
    } else {
      const next = pinConfirm + digit
      setPinConfirm(next)
      if (next.length === 6) {
        if (next !== pinInput) {
          setPinInput('')
          setPinConfirm('')
          setPinStep('enter')
          alert('Mã PIN không khớp. Vui lòng thử lại.')
        } else {
          const hash = await hashPIN(next)
          await update({ pinEnabled: true, pinHash: hash })
          setShowPinSetup(false)
        }
      }
    }
  }

  async function handleEnableBiometric() {
    if (!isBiometricSupported()) {
      alert('Thiết bị không hỗ trợ sinh trắc học')
      return
    }
    try {
      const credentialId = await registerBiometric(userProfile?.id ?? 'user')
      await update({ biometricEnabled: true, biometricCredentialId: credentialId })
    } catch (err) {
      alert('Đăng ký sinh trắc học thất bại: ' + String(err))
    }
  }

  async function handleLocalBackup() {
    setBackupStatus('loading')
    try {
      await backupToLocalFile()
      setBackupStatus('success')
      setBackupMessage('Đã lưu file backup')
    } catch (err) {
      setBackupStatus('error')
      setBackupMessage(String(err))
    }
    setTimeout(() => setBackupStatus('idle'), 3000)
  }

  async function handleRestoreFromFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await restoreFromLocalFile(file)
      alert('Khôi phục dữ liệu thành công!')
      window.location.reload()
    } catch (err) {
      alert('Lỗi khôi phục: ' + String(err))
    }
    e.target.value = ''
  }

  async function handleDriveBackup() {
    setBackupStatus('loading')
    try {
      const token = await requestDriveAccess()
      await backupToGoogleDrive(token)
      setBackupStatus('success')
      setBackupMessage('Đã backup lên Google Drive')
    } catch (err) {
      setBackupStatus('error')
      setBackupMessage(String(err))
    }
    setTimeout(() => setBackupStatus('idle'), 3000)
  }

  async function handleShowDriveList() {
    try {
      const token = await requestDriveAccess()
      const files = await listDriveBackups(token)
      setDriveFiles(files)
      setShowDriveList(true)
    } catch (err) {
      alert('Lỗi: ' + String(err))
    }
  }

  async function handleRestoreFromDrive(fileId: string) {
    if (!confirm('Bạn có chắc muốn khôi phục từ backup này? Dữ liệu hiện tại sẽ bị ghi đè.')) return
    try {
      const token = await requestDriveAccess()
      await restoreFromGoogleDrive(fileId, token)
      alert('Khôi phục thành công!')
      window.location.reload()
    } catch (err) {
      alert('Lỗi: ' + String(err))
    }
  }

  async function handleClearData() {
    await clearAllData()
    setAuthenticated(false)
    window.location.reload()
  }

  async function handleNotificationToggle(enabled: boolean) {
    if (enabled) {
      const granted = await requestNotificationPermission()
      if (granted) {
        await update({ notificationsEnabled: true })
      }
    } else {
      await update({ notificationsEnabled: false })
    }
  }

  const pinDigits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']

  return (
    <div className="min-h-full bg-gray-50 dark:bg-gray-800">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold">Cài đặt</h1>
      </div>

      <div className="px-4 space-y-4 pb-8">
        {/* Account */}
        <Link to="/profile">
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={displayName} />
                  ) : (
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(displayName)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{userProfile?.email ?? 'Chưa đăng nhập Google'}</p>
                </div>
                <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Security */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={16} className="text-primary" />
              <h2 className="font-semibold">Bảo mật</h2>
            </div>

            <SettingRow
              label="Mã PIN khi mở app"
              description={settings.pinEnabled ? 'Đã bật' : 'Chưa bật'}
            >
              <Switch
                checked={settings.pinEnabled}
                onCheckedChange={(checked) => {
                  if (checked) handleEnablePin()
                  else update({ pinEnabled: false, pinHash: undefined })
                }}
              />
            </SettingRow>

            {isBiometricSupported() && (
              <SettingRow
                label="Vân tay / Face ID"
                description={settings.biometricEnabled ? 'Đã đăng ký' : 'Chưa đăng ký'}
              >
                <Switch
                  checked={settings.biometricEnabled}
                  onCheckedChange={(checked) => {
                    if (checked) handleEnableBiometric()
                    else update({ biometricEnabled: false, biometricCredentialId: undefined })
                  }}
                />
              </SettingRow>
            )}

            <SettingRow label="Tự khóa sau">
              <Select
                value={String(settings.lockAfterMinutes)}
                onValueChange={v => update({ lockAfterMinutes: Number(v) })}
              >
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Ngay lập tức</SelectItem>
                  <SelectItem value="5">5 phút</SelectItem>
                  <SelectItem value="15">15 phút</SelectItem>
                  <SelectItem value="30">30 phút</SelectItem>
                  <SelectItem value="60">1 giờ</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Backup */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CloudUpload size={16} className="text-primary" />
              <h2 className="font-semibold">Sao lưu & Khôi phục</h2>
            </div>

            <SettingRow label="Tự động backup">
              <Switch
                checked={settings.autoBackupEnabled}
                onCheckedChange={checked => update({ autoBackupEnabled: checked })}
              />
            </SettingRow>

            {settings.autoBackupEnabled && (
              <>
                <SettingRow label="Tần suất">
                  <Select value={settings.autoBackupFrequency} onValueChange={v => update({ autoBackupFrequency: v as 'daily' | 'weekly' | 'monthly' })}>
                    <SelectTrigger className="w-32 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Hàng ngày</SelectItem>
                      <SelectItem value="weekly">Hàng tuần</SelectItem>
                      <SelectItem value="monthly">Hàng tháng</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>

                <SettingRow label="Giữ lại">
                  <Select value={String(settings.maxBackupVersions)} onValueChange={v => update({ maxBackupVersions: Number(v) })}>
                    <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 bản</SelectItem>
                      <SelectItem value="5">5 bản</SelectItem>
                      <SelectItem value="10">10 bản</SelectItem>
                      <SelectItem value="0">Không giới hạn</SelectItem>
                    </SelectContent>
                  </Select>
                </SettingRow>
              </>
            )}

            {settings.lastBackupAt && (
              <p className="text-xs text-muted-foreground">
                Backup lần cuối: {new Date(settings.lastBackupAt).toLocaleString('vi-VN')}
              </p>
            )}

            <div className="space-y-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={handleLocalBackup}
                disabled={backupStatus === 'loading'}
              >
                {backupStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> :
                 backupStatus === 'success' ? <Check size={14} className="text-green-500" /> :
                 <Download size={14} />}
                Lưu file xuống thiết bị
              </Button>

              <label className="block">
                <Button variant="outline" size="sm" className="w-full gap-2 justify-start cursor-pointer" asChild>
                  <span>
                    <Upload size={14} />
                    Nhập từ file backup
                  </span>
                </Button>
                <input type="file" accept=".json" className="hidden" onChange={handleRestoreFromFile} />
              </label>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={handleDriveBackup}
                disabled={backupStatus === 'loading'}
              >
                {backupStatus === 'loading' ? <Loader2 size={14} className="animate-spin" /> :
                 backupStatus === 'success' ? <Check size={14} className="text-green-500" /> :
                 <CloudUpload size={14} />}
                Backup lên Google Drive
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 justify-start"
                onClick={handleShowDriveList}
              >
                <Download size={14} />
                Khôi phục từ Google Drive
              </Button>

              {backupMessage && (
                <p className={`text-xs ${backupStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>
                  {backupMessage}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Bell size={16} className="text-primary" />
              <h2 className="font-semibold">Thông báo</h2>
            </div>
            <SettingRow label="Bật thông báo">
              <Switch
                checked={settings.notificationsEnabled}
                onCheckedChange={handleNotificationToggle}
              />
            </SettingRow>
            <SettingRow label="Nhắc trước">
              <Select value={String(settings.reminderLeadDays)} onValueChange={v => update({ reminderLeadDays: Number(v) })}>
                <SelectTrigger className="w-28 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 ngày</SelectItem>
                  <SelectItem value="3">3 ngày</SelectItem>
                  <SelectItem value="7">7 ngày</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Moon size={16} className="text-primary" />
              <h2 className="font-semibold">Giao diện</h2>
            </div>
            <SettingRow label="Chế độ màu">
              <Select value={settings.darkMode} onValueChange={v => update({ darkMode: v as 'system' | 'light' | 'dark' })}>
                <SelectTrigger className="w-36 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="system">Theo hệ thống</SelectItem>
                  <SelectItem value="light">Sáng</SelectItem>
                  <SelectItem value="dark">Tối</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </CardContent>
        </Card>

        {/* Custom fields */}
        <Link to="/custom-fields">
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-medium text-sm">Trường tùy chỉnh</p>
                <p className="text-xs text-muted-foreground">Quản lý trường dữ liệu tùy chỉnh</p>
              </div>
              <ChevronRight size={16} className="text-gray-400 dark:text-gray-500" />
            </CardContent>
          </Card>
        </Link>

        {/* Danger zone */}
        <Card className="border-red-200">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Trash2 size={16} className="text-red-500" />
              <h2 className="font-semibold text-red-600">Vùng nguy hiểm</h2>
            </div>
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2"
              onClick={() => setShowClearConfirm(true)}
            >
              <Trash2 size={14} />
              Xóa toàn bộ dữ liệu
            </Button>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Info size={16} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">MiNet CRM</p>
              <p className="text-xs text-muted-foreground">Phiên bản 1.0.0 · Privacy first</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PIN Setup dialog */}
      <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {pinStep === 'enter' ? 'Đặt mã PIN (6 chữ số)' : 'Xác nhận mã PIN'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-2">
            <div className="flex gap-3">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className={`w-3.5 h-3.5 rounded-full border-2 ${
                  (pinStep === 'enter' ? pinInput.length : pinConfirm.length) > i
                    ? 'bg-primary border-primary'
                    : 'border-gray-300 dark:border-gray-600'
                }`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 w-full max-w-[220px]">
              {pinDigits.map((d, i) => {
                if (d === '') return <div key={i} />
                if (d === 'del') return (
                  <button key={i} type="button"
                    onClick={() => {
                      if (pinStep === 'enter') setPinInput(p => p.slice(0, -1))
                      else setPinConfirm(p => p.slice(0, -1))
                    }}
                    className="flex items-center justify-center h-12 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                    ⌫
                  </button>
                )
                return (
                  <button key={i} type="button"
                    onClick={() => handlePinDigit(d)}
                    className="flex items-center justify-center h-12 rounded-xl text-xl font-medium bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all select-none">
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear data confirmation */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xóa toàn bộ dữ liệu</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Thao tác này sẽ xóa <strong>toàn bộ</strong> liên hệ, sự kiện, nhắc nhở và lịch sử. <strong>Không thể hoàn tác.</strong>
            <br /><br />Đảm bảo bạn đã backup dữ liệu trước khi xóa.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowClearConfirm(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleClearData}>Xóa tất cả</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Drive backup list */}
      <Dialog open={showDriveList} onOpenChange={setShowDriveList}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chọn backup để khôi phục</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-60 overflow-auto">
            {driveFiles.length === 0 ? (
              <p className="text-sm text-center text-muted-foreground py-4">Chưa có backup trên Drive</p>
            ) : (
              driveFiles.map(f => (
                <button
                  key={f.id}
                  onClick={() => { setShowDriveList(false); handleRestoreFromDrive(f.id) }}
                  className="w-full text-left p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <p className="text-sm font-medium">{f.name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(f.createdTime).toLocaleString('vi-VN')}</p>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}
