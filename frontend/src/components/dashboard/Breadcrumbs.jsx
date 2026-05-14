import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const LABELS = {
  donor: 'Donor',
  hospital: 'Hospital',
  seeker: 'Seeker',
  feed: 'Matched Requests',
  pledges: 'My Pledges',
  donations: 'Donations',
  certificates: 'Certificates',
  profile: 'Profile',
  queue: 'Verification Queue',
  active: 'Active Requests',
  donors: 'Donors',
  requests: 'My Requests',
  new: 'New Request',
  inventory: 'Blood Inventory',
  account: 'Account',
  password: 'Change Password',
}

export function Breadcrumbs() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)

  if (parts.length <= 1) return null

  const crumbs = parts.map((part, i) => {
    const label = LABELS[part] ?? part
    const to = '/' + parts.slice(0, i + 1).join('/')
    const isLast = i === parts.length - 1
    return { label, to, isLast }
  })

  return (
    <nav aria-label="Breadcrumb" className="hidden md:flex items-center gap-1 text-xs text-slate-400">
      {crumbs.map((crumb) => (
        <span key={crumb.to} className="flex items-center gap-1">
          {!crumb.isLast ? (
            <>
              <Link to={crumb.to} className="hover:text-slate-700 transition-colors">{crumb.label}</Link>
              <ChevronRight className="h-3 w-3" />
            </>
          ) : (
            <span className="text-slate-600 font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
