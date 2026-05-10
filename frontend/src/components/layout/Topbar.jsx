import { Link, useNavigate } from 'react-router-dom'
import { Droplet, LogOut, KeyRound, User } from 'lucide-react'
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

export function Topbar() {
  const { account, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-slate-200 bg-white px-6">
      <Link to="/" className="flex items-center gap-2 mr-4">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-brand-600 text-white">
          <Droplet className="h-3.5 w-3.5" fill="currentColor" />
        </span>
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
