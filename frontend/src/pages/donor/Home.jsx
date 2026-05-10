import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Activity, HeartPulse, Award, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingState, CardSkeleton } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { getDonorProfile } from '@/services/endpoints/donor'
import { getDonorFeed } from '@/services/endpoints/feed'
import { useAuth } from '@/context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { DONOR_STATUS } from '@/lib/enums'

const STATUS_CONFIG = {
  [DONOR_STATUS.AVAILABLE]: { variant: 'success', label: 'Available' },
  [DONOR_STATUS.RECOVERING]: { variant: 'warning', label: 'Recovering' },
  [DONOR_STATUS.UNAVAILABLE]: { variant: 'default', label: 'Unavailable' },
  [DONOR_STATUS.INELIGIBLE]: { variant: 'danger', label: 'Not Enrolled' },
}

export default function DonorHome() {
  const { account } = useAuth()

  const { data: profile, isLoading: pLoading, error: pError, refetch: pRefetch } = useQuery({
    queryKey: ['donor', 'profile'],
    queryFn: getDonorProfile,
  })

  const { data: feedData, isLoading: fLoading } = useQuery({
    queryKey: ['donor', 'feed', {}],
    queryFn: () => getDonorFeed({ limit: 3 }),
    staleTime: 0,
  })

  const feed = feedData?.requests ?? feedData ?? []

  if (pLoading) return <AppShell><LoadingState /></AppShell>
  if (pError) return <AppShell><ErrorState message={pError.message} onRetry={pRefetch} /></AppShell>

  const status = profile?.effectiveStatus ?? 'INELIGIBLE'
  const statusCfg = STATUS_CONFIG[status] ?? { variant: 'default', label: status }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {account?.name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-sm text-slate-500">Here's your donor overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard
            title="Donor Status"
            value={<Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>}
            sub={profile?.daysUntilAvailable > 0 ? `${profile.daysUntilAvailable} days left` : null}
          />
          <StatCard
            title="Total Donations"
            value={profile?.donationCount ?? 0}
            icon={<Activity className="h-4 w-4 text-brand-500" />}
            href="/donor/donations"
          />
          <StatCard
            title="Active Pledges"
            value={profile?.activePledgeCount ?? 0}
            icon={<HeartPulse className="h-4 w-4 text-amber-500" />}
            href="/donor/pledges"
          />
          <StatCard
            title="Certificates"
            value={profile?.certificateCount ?? 0}
            icon={<Award className="h-4 w-4 text-emerald-500" />}
            href="/donor/certificates"
          />
        </div>

        {/* Recent feed */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Active Matches</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/donor/feed">View all <ChevronRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>

          {fLoading ? (
            <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>
          ) : feed.length === 0 ? (
            <p className="text-sm text-slate-500">No matching requests in your area right now.</p>
          ) : (
            <div className="space-y-3">
              {feed.slice(0, 3).map((req) => (
                <FeedCard key={req._id} req={req} />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

function StatCard({ title, value, sub, icon, href }) {
  const inner = (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</p>
          {icon}
        </div>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
      </CardContent>
    </Card>
  )
  return href ? <Link to={href}>{inner}</Link> : inner
}

function FeedCard({ req }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <BloodGroupBadge group={req.bloodGroup} />
              <UrgencyBadge urgency={req.urgency} />
              <span className="text-xs text-slate-400">
                {req.requiredBy ? `Required ${formatDistanceToNow(new Date(req.requiredBy), { addSuffix: true })}` : ''}
              </span>
            </div>
            <p className="mt-1.5 text-sm font-medium text-slate-700 truncate">
              {req.hospital?.name ?? 'Hospital'} · {req.hospital?.pincode}
            </p>
            <p className="text-xs text-slate-500">
              {req.unitsRequired} unit{req.unitsRequired !== 1 ? 's' : ''} needed
            </p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link to="/donor/feed">Accept</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
