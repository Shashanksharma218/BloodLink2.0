import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { cn } from '@/utils/cn'
import {
  Activity, FileText, Award, User,
  Building2, ClipboardList, CheckSquare, HeartPulse,
  Search, List, PlusCircle, Users, Droplets,
} from 'lucide-react'
import { BloodDropIcon } from '@/components/shared/BloodDropIcon'
import { useAuth } from '@/context/AuthContext'
import { DONOR_STATUS } from '@/lib/enums'

const INVENTORY_NAV = { to: '/inventory', label: 'Blood Inventory', icon: Droplets, group: 'RESOURCES' }

const DONOR_NAV = [
  { to: '/donor', label: 'Overview', icon: Activity, exact: true, group: 'OVERVIEW' },
  { to: '/donor/feed', label: 'Matched Requests', icon: Search, group: 'WORK' },
  { to: '/donor/pledges', label: 'My Pledges', icon: HeartPulse, group: 'WORK' },
  { to: '/donor/donations', label: 'Donations', icon: BloodDropIcon, group: 'WORK' },
  { to: '/donor/certificates', label: 'Certificates', icon: Award, group: 'WORK' },
  INVENTORY_NAV,
  { to: '/donor/profile', label: 'Profile', icon: User, group: 'ACCOUNT' },
]

const SEEKER_NAV = [
  { to: '/seeker', label: 'Overview', icon: Activity, exact: true, group: 'OVERVIEW' },
  { to: '/seeker/requests', label: 'My Requests', icon: List, group: 'WORK' },
  { to: '/seeker/requests/new', label: 'New Request', icon: PlusCircle, group: 'WORK' },
  INVENTORY_NAV,
  { to: '/donor/profile', label: 'Profile', icon: User, group: 'ACCOUNT' },
]

const HOSPITAL_NAV = [
  { to: '/hospital', label: 'Overview', icon: Activity, exact: true, group: 'OVERVIEW' },
  { to: '/hospital/queue', label: 'Verification Queue', icon: ClipboardList, group: 'WORK' },
  { to: '/hospital/active', label: 'Active Requests', icon: CheckSquare, group: 'WORK' },
  { to: '/hospital/donations', label: 'Donations', icon: BloodDropIcon, group: 'WORK' },
  { to: '/hospital/donors', label: 'Donors', icon: Users, group: 'WORK' },
  INVENTORY_NAV,
  { to: '/hospital/profile', label: 'Profile', icon: Building2, group: 'ACCOUNT' },
]

function NavItem({ to, label, icon: Icon, exact, layoutId }) {
  const location = useLocation()
  const active = exact ? location.pathname === to : location.pathname.startsWith(to)

  return (
    <Link
      to={to}
      className={cn(
        'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
        active
          ? 'text-brand-700 bg-brand-50'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      )}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          className="absolute inset-0 rounded-xl bg-brand-50"
          transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        />
      )}
      <motion.span
        className="relative"
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.15 }}
      >
        <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-brand-600' : 'text-slate-400')} />
      </motion.span>
      <span className="relative">{label}</span>
    </Link>
  )
}

function SidebarFooter({ isHospital, mode, account }) {
  if (isHospital) {
    return (
      <div className="mx-3 mb-3 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2.5">
        <p className="text-xs font-semibold text-emerald-700">Hospital</p>
        <p className="text-xs text-emerald-600 truncate">{account?.name ?? '—'}</p>
      </div>
    )
  }

  if (mode === 'donor') {
    const days = account?.daysUntilAvailable ?? 0
    const status = account?.effectiveStatus ?? DONOR_STATUS.INELIGIBLE
    const available = status === DONOR_STATUS.AVAILABLE

    return (
      <div className={cn(
        'mx-3 mb-3 rounded-xl border px-3 py-2.5',
        available ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
      )}>
        <p className={cn('text-xs font-semibold', available ? 'text-emerald-700' : 'text-amber-700')}>
          {available ? '✓ Available to donate' : 'Recovering'}
        </p>
        {days > 0 && (
          <p className="text-xs text-amber-600">Available in {days} day{days !== 1 ? 's' : ''}</p>
        )}
      </div>
    )
  }

  return null
}

export function Sidebar() {
  const { isHospital, mode, account } = useAuth()
  const layoutId = `sidebar-active-${isHospital ? 'hospital' : mode}`

  let nav = DONOR_NAV
  if (isHospital) nav = HOSPITAL_NAV
  else if (mode === 'seeker') nav = SEEKER_NAV

  const groups = ['OVERVIEW', 'WORK', 'RESOURCES', 'ACCOUNT']

  return (
    <aside className="flex flex-col flex-1 py-3">
      <div className="flex-1 px-3 space-y-0.5">
        {groups.map((group) => {
          const items = nav.filter((n) => n.group === group)
          if (!items.length) return null
          return (
            <div key={group} className="mb-1">
              {group !== 'OVERVIEW' && (
                <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  {group}
                </p>
              )}
              {items.map((item) => (
                <NavItem key={item.to} layoutId={layoutId} {...item} />
              ))}
            </div>
          )
        })}
      </div>

      <SidebarFooter isHospital={isHospital} mode={mode} account={account} />
    </aside>
  )
}
