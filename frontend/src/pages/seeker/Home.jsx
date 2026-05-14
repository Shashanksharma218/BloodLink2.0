import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PlusCircle, ChevronRight, CheckCircle2, Clock, HeartPulse, Layers } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { RequestStatusBadge } from '@/components/shared/RequestStatusBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { KPICard } from '@/components/dashboard/KPICard'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { BarComparison } from '@/components/dashboard/charts/BarComparison'
import { useSeekerMetrics } from '@/hooks/useDashboardMetrics'
import { useAuth } from '@/context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { REQUEST_STATUS } from '@/lib/enums'
import { MOTION_FADE_UP, staggerChild } from '@/components/dashboard/theme'

const STATUS_STAGES = [
  { status: REQUEST_STATUS.PENDING_VERIFICATION, label: 'Pending', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  { status: REQUEST_STATUS.VERIFIED, label: 'Verified', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { status: REQUEST_STATUS.PARTIALLY_FULFILLED, label: 'Partial', icon: HeartPulse, color: 'text-brand-500', bg: 'bg-brand-50' },
  { status: REQUEST_STATUS.FULFILLED, label: 'Fulfilled', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-100' },
]

function buildFulfillmentChart(requests) {
  return requests.slice(0, 6).map((r) => ({
    label: r.bloodGroup,
    value: r.unitsRequired ?? 0,
  }))
}

export default function SeekerHome() {
  const { account } = useAuth()
  const {
    isLoading, error, refetch,
    activeRequests, fulfilledCount, pendingCount, totalPledges, totalCount,
  } = useSeekerMetrics()

  const firstName = account?.name?.split(' ')[0] ?? 'there'
  const chartData = buildFulfillmentChart(activeRequests)

  if (isLoading) return <AppShell><LoadingState /></AppShell>
  if (error) return <AppShell><ErrorState message={error.message} onRetry={refetch} /></AppShell>

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Greeting hero */}
        <motion.div
          {...MOTION_FADE_UP}
          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-amber-600 to-amber-700 px-6 py-6 text-white shadow-lg"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1">
              <p className="text-amber-200 text-sm font-medium">Blood Requests</p>
              <h1 className="text-2xl font-bold mt-0.5">Welcome, {firstName}</h1>
              <p className="mt-1 text-amber-200 text-sm">
                {activeRequests.length === 0
                  ? 'No active requests — we hope it stays that way 💖'
                  : `${activeRequests.length} active request${activeRequests.length !== 1 ? 's' : ''} in progress`}
              </p>
            </div>
            <Button asChild size="sm" className="shrink-0 bg-white text-amber-700 hover:bg-amber-50">
              <Link to="/seeker/requests/new">
                <PlusCircle className="h-4 w-4" />
                New Request
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              title: 'Active Requests',
              value: activeRequests.length,
              icon: <Layers className="h-5 w-5 text-amber-600" />,
              accentColor: '#d97706',
              accentBg: 'bg-amber-50',
              href: '/seeker/requests',
            },
            {
              title: 'Fulfilled',
              value: fulfilledCount,
              icon: <CheckCircle2 className="h-5 w-5 text-emerald-600" />,
              accentColor: '#059669',
              accentBg: 'bg-emerald-50',
            },
            {
              title: 'Pending Verify',
              value: pendingCount,
              icon: <Clock className="h-5 w-5 text-slate-500" />,
              accentColor: '#64748b',
              accentBg: 'bg-slate-100',
            },
            {
              title: 'Pledges Received',
              value: totalPledges,
              icon: <HeartPulse className="h-5 w-5 text-brand-600" />,
              accentColor: '#be123c',
              accentBg: 'bg-brand-50',
            },
          ].map((card, i) => (
            <motion.div key={card.title} {...MOTION_FADE_UP} {...staggerChild(i)}>
              <KPICard {...card} className="h-full" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Active requests timeline */}
          <SectionCard
            title="Active Requests"
            action="All requests"
            actionTo="/seeker/requests"
            className="lg:col-span-2"
            accentColor="#d97706"
          >
            {activeRequests.length === 0 ? (
              <EmptyMascot
                size="sm"
                title="No active requests"
                description="Create a blood request to get matched with nearby donors."
                action="Create request"
                actionTo="/seeker/requests/new"
              />
            ) : (
              <div className="space-y-3">
                {activeRequests.slice(0, 4).map((req) => (
                  <RequestTimelineCard key={req._id} req={req} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Units needed chart */}
          <SectionCard title="Units by Request" accentColor="#d97706">
            {chartData.length === 0 ? (
              <EmptyMascot size="sm" title="No data yet" />
            ) : (
              <BarComparison
                data={chartData}
                xKey="label"
                yKey="value"
                color="#d97706"
                valueLabel="Units"
                height={190}
              />
            )}
          </SectionCard>
        </div>
      </div>
    </AppShell>
  )
}

function RequestTimelineCard({ req }) {
  const fulfilled = req.unitsFulfilled ?? 0
  const total = req.unitsRequired ?? 1
  const pct = Math.min(100, Math.round((fulfilled / total) * 100))

  const stage = STATUS_STAGES.find((s) => s.status === req.status) ?? STATUS_STAGES[0]
  const StageIcon = stage.icon

  return (
    <Link to={`/seeker/requests/${req._id}`}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        className="rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-amber-200 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${stage.bg}`}>
            <StageIcon className={`h-3.5 w-3.5 ${stage.color}`} />
          </div>
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <BloodGroupBadge group={req.bloodGroup} />
              <UrgencyBadge urgency={req.urgency} />
              <RequestStatusBadge status={req.status} />
            </div>
            <p className="text-sm font-medium text-slate-800 truncate">
              {req.patient?.name ?? 'Patient'} · {req.hospital?.name ?? 'Hospital'}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 whitespace-nowrap shrink-0">
                {fulfilled}/{total} units
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 mt-1" />
        </div>
      </motion.div>
    </Link>
  )
}
