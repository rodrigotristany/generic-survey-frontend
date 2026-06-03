import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ClipboardList, Library, LogOut, Menu, X } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/surveys', label: 'Surveys', icon: ClipboardList },
  { to: '/questions', label: 'Question Library', icon: Library },
]

function NavLinks({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavClick}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
            )
          }
        >
          <Icon className="w-4 h-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

export default function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out')
    navigate('/login')
  }

  const logoutButton = (
    <div className="px-3 py-4 border-t">
      <Button
        variant="ghost"
        className="w-full justify-start gap-3 text-sm text-muted-foreground hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="w-4 h-4" />
        Logout
      </Button>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Mobile top bar */}
      <header className="flex md:hidden items-center gap-3 px-4 h-14 border-b bg-sidebar sticky top-0 z-40 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">Survey Admin</span>
        </div>
      </header>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <aside className="w-64 bg-sidebar border-r flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b shrink-0">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">Survey Admin</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <NavLinks onNavClick={() => setSidebarOpen(false)} />
            {logoutButton}
          </aside>
          <div className="flex-1 bg-black/50" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 border-r bg-sidebar flex-col shrink-0">
        <div className="px-6 py-5 border-b">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Survey Admin</span>
          </div>
        </div>
        <NavLinks />
        {logoutButton}
      </aside>

      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
