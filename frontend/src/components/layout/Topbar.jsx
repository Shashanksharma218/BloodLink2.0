import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, KeyRound, User, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { RoleSwitcher } from '@/components/shared/RoleSwitcher'
import { Breadcrumbs } from '@/components/dashboard/Breadcrumbs'
import { CommandPalette } from '@/components/dashboard/CommandPalette'
import { NotificationsDropdown } from '@/components/dashboard/NotificationsDropdown'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Sidebar } from '@/components/layout/Sidebar'

export function Topbar() {
  const { account, logout, isHospital } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const profileRoute = isHospital ? '/hospital/profile' : '/donor/profile'
  const initial = account?.name?.[0]?.toUpperCase() ?? 'U'

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-slate-200 bg-white/90 backdrop-blur-sm px-4 md:px-6">
      {/* Mobile hamburger */}
      {account && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-60 p-0">
            <SheetHeader className="px-4 py-3 border-b border-slate-100">
              <SheetTitle className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <img src="/blood-drop.png" alt="" className="h-5 w-5 object-contain" />
                BloodLink
              </SheetTitle>
            </SheetHeader>
            <div onClick={() => setDrawerOpen(false)}>
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <img src="/blood-drop.png" alt="" className="h-7 w-7 object-contain" />
        <span className="hidden sm:inline text-base font-bold text-slate-900">BloodLink</span>
      </Link>

      {/* Breadcrumbs */}
      {account && (
        <div className="hidden md:flex items-center ml-2">
          <Breadcrumbs />
        </div>
      )}

      <div className="flex-1" />

      {/* Right cluster */}
      <div className="flex items-center gap-2">
        {account && <CommandPalette />}
        {account && <NotificationsDropdown />}
        <RoleSwitcher />

        {account && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold hover:bg-brand-200 transition-colors ring-2 ring-transparent hover:ring-brand-200">
                {initial}
                {/* Online dot */}
                <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="pb-0">{account.name}</DropdownMenuLabel>
              <DropdownMenuLabel className="font-normal text-slate-500 normal-case tracking-normal pt-0 text-xs truncate">
                {account.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(profileRoute)}>
                <User className="h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/account/password')}>
                <KeyRound className="h-4 w-4" />
                Change password
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-red-600 hover:text-red-700">
                <LogOut className="h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}
