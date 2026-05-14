import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, CheckSquare, Activity, Users, Clock } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { RequestStatusBadge } from '@/components/shared/RequestStatusBadge'
import { KPICard } from '@/components/dashboard/KPICard'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { AreaTrend } from '@/components/dashboard/charts/AreaTrend'
import { DonutBreakdown } from '@/components/dashboard/charts/DonutBreakdown'
import {
  getHospitalRequests,
  getHospitalDonations,
  getNearbyDonors,
} from '@/services/endpoints/hospital'
import { useAuth } from '@/context/AuthContext'
import { useHospitalActivityFeed } from '@/hooks/useActivityFeed'
import { useHospitalDonationTrend } from '@/hooks/useTrendData'
import { useHospitalMetrics } from '@/hooks/useDashboardMetrics'
import { MOTION_FADE_UP, staggerChild } from '@/components/dashboard/theme'

function buildBloodGroupData(requests = []) {
  const counts = {}
  for (const r of requests) {
    counts[r.bloodGroup] = (counts[r.bloodGroup] ?? 0) + 1
  }
  return Object.entries(counts).map(([name, value]) => ({ name, value }))
}

export default function HospitalHome() {
  const { account } = useAuth()
  const metrics = useHospitalMetrics()
  const activityItems = useHospitalActivityFeed()
  const trendData = useHospitalDonationTrend()

  const { data: queueData } = useQuery({
    queryKey: ['hospital', 'requests', { status: 'PENDING_VERIFICATION', limit: 5 }],
    queryFn: () => getHospitalRequests({ status: 'PENDING_VERIFICATION', limit: 5 }),
    staleTime: 0,
  })

  const { data: activeData } = useQuery({
    queryKey: ['hospital', 'requests', { status: 'VERIFIED', limit: 5 }],
    queryFn: () => getHospitalRequests({ status: 'VERIFIED', limit: 5 }),
    staleTime: 0,
  })

  const { data: donorsData } = useQuery({
    queryKey: ['hospital', 'donors', { limit: 5 }],
    queryFn: () => getNearbyDonors({ limit: 5 }),
    staleTime: 60_000,
  })

  const pendingRequests = queueData?.requests ?? []
  const activeRequests = activeData?.requests ?? []
  const donors = donorsData?.donors ?? []

  const bloodGroupData = buildBloodGroupData([...pendingRequests, ...activeRequests])

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Greeting hero */}
        <motion.div
          {...MOTION_FADE_UP}
          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-emerald-700 to-emerald-800 px-6 py-6 text-white shadow-lg"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-emerald-200 text-sm font-medium">Hospital Dashboard</p>
              <h1 className="text-2xl font-bold mt-0.5">{account?.name ?? 'Welcome'}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant="success" className="text-xs bg-white/20 text-white border-0">
                  ✓ Verified
                </Badge>
                {account?.licenseNumber && (
                  <span className="text-xs text-emerald-200 font-mono">{account.licenseNumber}</span>
                )}
              </div>
            </div>
            <div className="hidden sm:block text-4xl select-none">🏥</div>
          </div>
        </motion.div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              title: 'Pending Verification',
              value: metrics.pendingCount,
              icon: <ClipboardList className="h-5 w-5 text-amber-600" />,
              accentColor: '#d97706',
              accentBg: 'bg-amber-50',
              href: '/hospital/queue',
            },
            {
              title: 'Active Requests',
              value: metrics.activeCount,
              icon: <CheckSquare className="h-5 w-5 text-emerald-600" />,
              accentColor: '#059669',
              accentBg: 'bg-emerald-50',
              href: '/hospital/active',
            },
            {
              title: 'This Month',
              value: metrics.thisMonthDonations,
              delta: metrics.monthDelta,
              deltaLabel: 'vs last month',
              icon: <Activity className="h-5 w-5 text-brand-600" />,
              accentColor: '#be123c',
              accentBg: 'bg-brand-50',
              href: '/hospital/donations',
              sparkData: trendData.map((d) => d.value),
            },
            {
              title: 'Awaiting Verify',
              value: metrics.awaitingVerification,
              icon: <Clock className="h-5 w-5 text-slate-500" />,
              accentColor: '#64748b',
              accentBg: 'bg-slate-100',
              href: '/hospital/donations',
            },
          ].map((card, i) => (
            <motion.div key={card.title} {...MOTION_FADE_UP} {...staggerChild(i)}>
              <KPICard {...card} className="h-full" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Donations trend */}
          <SectionCard title="Donations — Last 6 months" className="lg:col-span-2" accentColor="#059669">
            <AreaTrend
              data={trendData}
              xKey="label"
              yKey="value"
              color="#059669"
              valueLabel="Donations"
              height={180}
            />
          </SectionCard>

          {/* Blood group demand */}
          <SectionCard title="Blood Group Demand" accentColor="#be123c">
            {bloodGroupData.length === 0 ? (
              <EmptyMascot size="sm" title="No active requests" />
            ) : (
              <DonutBreakdown data={bloodGroupData} height={200} />
            )}
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Verification queue preview */}
          <SectionCard
            title="Verification Queue"
            action="View all"
            actionTo="/hospital/queue"
            className="lg:col-span-2"
            accentColor="#d97706"
          >
            {pendingRequests.length === 0 ? (
              <EmptyMascot size="sm" title="Queue is clear!" description="No pending verifications right now." />
            ) : (
              <div className="space-y-2">
                {pendingRequests.slice(0, 4).map((req) => (
                  <QueueRow key={req._id} req={req} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Top donors */}
          <SectionCard title="Top Donors" action="All donors" actionTo="/hospital/donors" accentColor="#059669">
            {donors.length === 0 ? (
              <EmptyMascot size="sm" title="No donors yet" />
            ) : (
              <div className="space-y-2">
                {donors.slice(0, 5).map((donor, i) => (
                  <DonorRow key={donor._id} donor={donor} rank={i + 1} />
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Activity feed */}
        <SectionCard title="Recent Activity" accentColor="#059669">
          <ActivityFeed items={activityItems} emptyText="No recent activity yet." />
        </SectionCard>
      </div>
    </AppShell>
  )
}

function QueueRow({ req }) {
  return (
    <motion.div
      whileHover={{ y: -1 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5"
    >
      <BloodGroupBadge group={req.bloodGroup} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{req.patient?.name ?? 'Patient'}</p>
        <p className="text-xs text-slate-500 truncate">{req.unitsRequired} units</p>
      </div>
      <UrgencyBadge urgency={req.urgency} />
      <Button asChild size="sm" variant="outline" className="shrink-0 h-7 text-xs px-2.5">
        <Link to="/hospital/queue">Review</Link>
      </Button>
    </motion.div>
  )
}

function DonorRow({ donor, rank }) {
  const initial = donor.name?.[0]?.toUpperCase() ?? '?'
  return (
    <div className="flex items-center gap-3">
      <span className="w-4 text-xs text-slate-400 text-center">{rank}</span>
      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-bold shrink-0">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 truncate">{donor.name}</p>
        <BloodGroupBadge group={donor.bloodGroup} />
      </div>
      {donor.donationCount != null && (
        <span className="text-xs text-slate-500 shrink-0">{donor.donationCount}×</span>
      )}
    </div>
  )
}
