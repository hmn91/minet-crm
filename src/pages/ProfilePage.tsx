import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Camera, Loader2, LogOut } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/stores/authStore'
import { saveUserProfile, deleteUserProfile } from '@/lib/db'
import { signOutGoogle } from '@/lib/auth'
import { getInitials, resizeImageToBase64, now } from '@/lib/utils'
import type { UserProfile } from '@/types'

interface FormData {
  displayName: string
  jobTitle: string
  organization: string
  bio: string
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { userProfile, setUserProfile, setGoogleAccessToken, logout } = useAuthStore()
  const [avatar, setAvatar] = useState<string | undefined>(
    userProfile?.customAvatarBase64 ?? userProfile?.avatarUrl
  )
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    defaultValues: {
      displayName: userProfile?.displayName ?? '',
      jobTitle: userProfile?.jobTitle ?? '',
      organization: userProfile?.organization ?? '',
      bio: userProfile?.bio ?? '',
    },
  })

  useEffect(() => {
    if (userProfile) {
      reset({
        displayName: userProfile.displayName,
        jobTitle: userProfile.jobTitle ?? '',
        organization: userProfile.organization ?? '',
        bio: userProfile.bio ?? '',
      })
      setAvatar(userProfile.customAvatarBase64 ?? userProfile.avatarUrl)
    }
  }, [userProfile, reset])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsLoading(true)
    try {
      const base64 = await resizeImageToBase64(file, 200)
      setAvatar(base64)
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }

  async function onSubmit(data: FormData) {
    const updated: UserProfile = {
      ...(userProfile ?? { id: 'current-user' as const }),
      displayName: data.displayName,
      jobTitle: data.jobTitle || undefined,
      organization: data.organization || undefined,
      bio: data.bio || undefined,
      customAvatarBase64: avatar?.startsWith('data:') ? avatar : userProfile?.customAvatarBase64,
      avatarUrl: avatar?.startsWith('http') ? avatar : userProfile?.avatarUrl,
      updatedAt: now(),
    }
    await saveUserProfile(updated)
    setUserProfile(updated)
    navigate(-1)
  }

  async function handleSignOut() {
    signOutGoogle()
    setGoogleAccessToken(null)
    // Delete only the profile (login credential); CRM data (contacts, events, etc.) stays in IDB
    await deleteUserProfile()
    setUserProfile(null)
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = userProfile?.displayName ?? 'Người dùng'

  return (
    <div className="min-h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b sticky top-0 bg-background z-10">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1">
          <ArrowLeft size={22} className="text-gray-700 dark:text-gray-300" />
        </button>
        <h1 className="font-semibold">Thông tin cá nhân</h1>
        <Button onClick={handleSubmit(onSubmit)} disabled={isSubmitting} size="sm">
          {isSubmitting ? 'Đang lưu...' : 'Lưu'}
        </Button>
      </div>

      <form className="px-4 py-6 space-y-6 pb-8">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-24 h-24">
              {avatar ? (
                <AvatarImage src={avatar} alt={displayName} className="object-cover" />
              ) : (
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {getInitials(displayName)}
                </AvatarFallback>
              )}
            </Avatar>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center shadow-md"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-primary mt-2"
          >
            Đổi ảnh đại diện
          </button>
          {userProfile?.avatarUrl && avatar !== userProfile.avatarUrl && (
            <button
              type="button"
              className="text-xs text-muted-foreground mt-1"
              onClick={() => setAvatar(userProfile.avatarUrl)}
            >
              Dùng ảnh Google
            </button>
          )}
        </div>

        {/* Form fields */}
        <section className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tên hiển thị *</Label>
            <Controller name="displayName" control={control} render={({ field }) => (
              <Input {...field} placeholder="Nguyễn Văn A" />
            )} />
          </div>

          {userProfile?.email && (
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input value={userProfile.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">Email từ tài khoản Google, không thể thay đổi</p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Chức danh</Label>
            <Controller name="jobTitle" control={control} render={({ field }) => (
              <Input {...field} placeholder="Sales Director, CEO..." />
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Tổ chức</Label>
            <Controller name="organization" control={control} render={({ field }) => (
              <Input {...field} placeholder="Công ty của bạn" />
            )} />
          </div>

          <div className="space-y-1.5">
            <Label>Giới thiệu</Label>
            <Controller name="bio" control={control} render={({ field }) => (
              <Textarea {...field} placeholder="Một chút giới thiệu về bạn..." rows={3} />
            )} />
          </div>
        </section>

        <div className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            className="w-full text-red-500 gap-2 justify-center"
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            Đăng xuất Google
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Dữ liệu CRM của bạn vẫn được giữ lại
          </p>
        </div>
      </form>
    </div>
  )
}
