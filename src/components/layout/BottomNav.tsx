import { NavLink } from 'react-router-dom'
import { Home, Users, Plus, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        <NavItem to="/" icon={<Home size={22} />} label="Trang chủ" />
        <NavItem to="/contacts" icon={<Users size={22} />} label="Liên hệ" />
        <AddButton />
        <NavItem to="/events" icon={<Calendar size={22} />} label="Sự kiện" />
        <NavItem to="/settings" icon={<Settings size={22} />} label="Cài đặt" />
      </div>
    </nav>
  )
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        cn(
          'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[56px]',
          isActive
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        )
      }
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

function AddButton() {
  return (
    <NavLink
      to="/contacts/new"
      className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
    >
      <Plus size={24} />
    </NavLink>
  )
}
