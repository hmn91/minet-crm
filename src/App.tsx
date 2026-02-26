import { useEffect, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { getUserProfile } from '@/lib/db'
import { checkAndNotifyDueReminders } from '@/lib/notifications'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/ErrorBoundary'

// Pages
import LoginPage from '@/pages/LoginPage'
import PinLockPage from '@/pages/PinLockPage'
import Dashboard from '@/pages/Dashboard'
import ContactsPage from '@/pages/ContactsPage'
import ContactDetailPage from '@/pages/ContactDetailPage'
import ContactFormPage from '@/pages/ContactFormPage'
import EventsPage from '@/pages/EventsPage'
import EventDetailPage from '@/pages/EventDetailPage'
import EventFormPage from '@/pages/EventFormPage'
import RemindersPage from '@/pages/RemindersPage'
import ProfilePage from '@/pages/ProfilePage'
import SettingsPage from '@/pages/SettingsPage'
import CustomFieldsPage from '@/pages/CustomFieldsPage'
import InteractionFormPage from '@/pages/InteractionFormPage'
import CompaniesPage, { CompanyDetailPage } from '@/pages/CompaniesPage'

// ─── Guards ───────────────────────────────────────────────────────────────────

function AuthGuard() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return <Outlet />
}

function PinGuard() {
  const { isPinLocked } = useAuthStore()
  const location = useLocation()
  if (isPinLocked) {
    return <Navigate to="/lock" state={{ from: location }} replace />
  }
  return <Outlet />
}

function GuestOnly() {
  const { isAuthenticated, isPinLocked } = useAuthStore()
  if (isAuthenticated && !isPinLocked) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}

// ─── App Initializer ─────────────────────────────────────────────────────────

function AppInitializer() {
  const { setAuthenticated, setUserProfile, setPinLocked } = useAuthStore()
  const { load: loadSettings, settings } = useSettingsStore()

  useEffect(() => {
    async function init() {
      await loadSettings()
      const profile = await getUserProfile()
      if (profile) {
        setUserProfile(profile)
        setAuthenticated(true)
        // If PIN is enabled, start locked
        if (settings.pinEnabled) {
          setPinLocked(true)
        }
      }
      // Check reminders after init
      await checkAndNotifyDueReminders()
    }
    void init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// ─── Auto-lock timer ──────────────────────────────────────────────────────────

function AutoLockTimer() {
  const { isAuthenticated, isPinLocked, setPinLocked } = useAuthStore()
  const { settings } = useSettingsStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !settings.pinEnabled || settings.lockAfterMinutes === 0) return

    const ms = settings.lockAfterMinutes * 60 * 1000

    function resetTimer() {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        if (!isPinLocked) setPinLocked(true)
      }, ms)
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }))
    resetTimer()

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [isAuthenticated, isPinLocked, settings.pinEnabled, settings.lockAfterMinutes, setPinLocked])

  return null
}

// ─── Dark mode effect ─────────────────────────────────────────────────────────

function DarkModeSync() {
  const { settings } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    const pref = settings.darkMode
    if (pref === 'dark') {
      root.classList.add('dark')
    } else if (pref === 'light') {
      root.classList.remove('dark')
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      if (mq.matches) root.classList.add('dark')
      else root.classList.remove('dark')
      const handler = (e: MediaQueryListEvent) => {
        if (e.matches) root.classList.add('dark')
        else root.classList.remove('dark')
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [settings.darkMode])

  return null
}

// ─── Router ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AppInitializer />
      <AutoLockTimer />
      <DarkModeSync />
      <Toaster position="top-center" richColors closeButton />
      <Routes>
        {/* Public routes */}
        <Route element={<GuestOnly />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/lock" element={<PinLockPage />} />

        {/* Protected routes */}
        <Route element={<AuthGuard />}>
          <Route element={<PinGuard />}>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="contacts" element={<ContactsPage />} />
              <Route path="contacts/new" element={<ContactFormPage />} />
              <Route path="contacts/:id" element={<ContactDetailPage />} />
              <Route path="contacts/:id/edit" element={<ContactFormPage />} />
              <Route path="interactions/new" element={<InteractionFormPage />} />
              <Route path="contacts/:id/interaction/new" element={<InteractionFormPage />} />
              <Route path="contacts/:id/reminder/new" element={<RemindersPage />} />
              <Route path="events" element={<EventsPage />} />
              <Route path="events/new" element={<EventFormPage />} />
              <Route path="events/:id" element={<EventDetailPage />} />
              <Route path="events/:id/edit" element={<EventFormPage />} />
              <Route path="reminders" element={<RemindersPage />} />
              <Route path="reminders/new" element={<RemindersPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="companies" element={<CompaniesPage />} />
              <Route path="companies/:id" element={<CompanyDetailPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="settings/custom-fields" element={<CustomFieldsPage />} />
            </Route>
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
