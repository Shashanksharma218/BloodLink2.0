import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, KeyRound, User, Menu } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { RoleSwitcher } from '@/components/shared/RoleSwitcher'
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

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-4 md:px-6">
      {/* Hamburger — visible below lg */}
      {account && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <div onClick={() => setDrawerOpen(false)}>
              <Sidebar />
            </div>
          </SheetContent>
        </Sheet>
      )}

      <Link to="/" className="flex items-center gap-2 mr-4">
        <img src="/blood-drop.png" alt="" className="h-7 w-7 object-contain" />
        <span className="text-base font-bold text-slate-900">BloodLink</span>
      </Link>

      <div className="flex-1" />

      <RoleSwitcher />

      {account && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-sm font-semibold hover:bg-brand-200 transition-colors">
              {account.name?.[0]?.toUpperCase() ?? 'U'}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{account.name}</DropdownMenuLabel>
            <DropdownMenuLabel className="font-normal text-slate-500 normal-case tracking-normal pt-0">
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
    </header>
  )
}
