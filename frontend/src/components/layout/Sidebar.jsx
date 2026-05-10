import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/utils/cn'
import {
  Droplet, Activity, FileText, Award, User,
  Building2, ClipboardList, CheckSquare, HeartPulse,
  Search, List, PlusCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const DONOR_NAV = [
  { to: '/donor', label: 'Overview', icon: Activity, exact: true },
  { to: '/donor/feed', label: 'Matched Requests', icon: Search },
  { to: '/donor/pledges', label: 'My Pledges', icon: HeartPulse },
  { to: '/donor/donations', label: 'Donations', icon: Droplet },
  { to: '/donor/certificates', label: 'Certificates', icon: Award },
  { to: '/donor/profile', label: 'Profile', icon: User },
]

const SEEKER_NAV = [
  { to: '/seeker', label: 'Overview', icon: Activity, exact: true },
  { to: '/seeker/requests', label: 'My Requests', icon: List },
  { to: '/seeker/requests/new', label: 'New Request', icon: PlusCircle },
]

const HOSPITAL_NAV = [
  { to: '/hospital', label: 'Overview', icon: Activity, exact: true },
  { to: '/hospital/queue', label: 'Verification Queue', icon: ClipboardList },
  { to: '/hospital/active', label: 'Active Requests', icon: CheckSquare },
  { to: '/hospital/donations', label: 'Donations', icon: Droplet },
  { to: '/hospital/profile', label: 'Profile', icon: Building2 },
]

function NavItem({ to, label, icon: Icon, exact }) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'bg-brand-50 text-brand-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      )}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-brand-600' : 'text-slate-400')} />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const { isHospital, mode } = useAuth()

  let nav = DONOR_NAV
  if (isHospital) nav = HOSPITAL_NAV
  else if (mode === 'seeker') nav = SEEKER_NAV

  return (
    <aside className="flex flex-col gap-1 px-3 py-4">
      {nav.map((item) => (
        <NavItem key={item.to} {...item} />
      ))}
    </aside>
  )
}
