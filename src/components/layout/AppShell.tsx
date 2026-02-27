import { Outlet } from 'react-router-dom'
import { BottomNav } from './BottomNav'
import { OfflineBanner, UpdateBanner, InstallPrompt } from './PWABanners'

export function AppShell() {
  return (
    <div className="flex flex-col h-dvh w-full max-w-lg mx-auto bg-background">
      <OfflineBanner />
      <main className="flex-1 overflow-auto pb-20">
        <Outlet />
      </main>
      <BottomNav />
      <UpdateBanner />
      <InstallPrompt />
    </div>
  )
}
