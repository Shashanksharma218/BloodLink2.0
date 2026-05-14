import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { HeartPulse, Award, Activity, Droplets, ChevronRight, Star } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { KPICard } from '@/components/dashboard/KPICard'
import { SectionCard } from '@/components/dashboard/SectionCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { AreaTrend } from '@/components/dashboard/charts/AreaTrend'
import { getDonorProfile } from '@/services/endpoints/donor'
import { getDonorFeed } from '@/services/endpoints/feed'
import { useAuth } from '@/context/AuthContext'
import { useDonorActivityFeed } from '@/hooks/useActivityFeed'
import { useDonorDonationTrend } from '@/hooks/useTrendData'
import { formatDistanceToNow } from 'date-fns'
import { DONOR_STATUS } from '@/lib/enums'
import { MOTION_FADE_UP, staggerChild } from '@/components/dashboard/theme'

const STATUS_CONFIG = {
  [DONOR_STATUS.AVAILABLE]: { variant: 'success', label: 'Available' },
  [DONOR_STATUS.RECOVERING]: { variant: 'warning', label: 'Recovering' },
  [DONOR_STATUS.UNAVAILABLE]: { variant: 'default', label: 'Unavailable' },
  [DONOR_STATUS.INELIGIBLE]: { variant: 'danger', label: 'Not Enrolled' },
}

const MILESTONES = [
  { label: 'First Drop', threshold: 1, icon: '💧' },
  { label: '5× Donor', threshold: 5, icon: '⭐' },
  { label: '10× Hero', threshold: 10, icon: '🏆' },
  { label: 'Lifesaver', threshold: 20, icon: '🩸' },
]

export default function DonorHome() {
  const { account } = useAuth()

  const { data: profile, isLoading, error, refetch } = useQuery({
    queryKey: ['donor', 'profile'],
    queryFn: getDonorProfile,
  })

  const { data: feedData, isLoading: fLoading } = useQuery({
    queryKey: ['donor', 'feed', {}],
    queryFn: () => getDonorFeed({ limit: 3 }),
    staleTime: 0,
  })

  const feed = feedData?.requests ?? feedData ?? []
  const activityItems = useDonorActivityFeed()
  const trendData = useDonorDonationTrend()

  if (isLoading) return <AppShell><LoadingState /></AppShell>
  if (error) return <AppShell><ErrorState message={error.message} onRetry={refetch} /></AppShell>

  const status = profile?.effectiveStatus ?? 'INELIGIBLE'
  const statusCfg = STATUS_CONFIG[status] ?? { variant: 'default', label: status }
  const donationCount = profile?.donationCount ?? 0
  const firstName = account?.name?.split(' ')[0] ?? 'there'

  return (
    <AppShell>
      <div className="space-y-6">

        {/* Greeting hero */}
        <motion.div
          {...MOTION_FADE_UP}
          className="relative overflow-hidden rounded-2xl bg-linear-to-br from-brand-600 to-brand-700 px-6 py-6 text-white shadow-lg"
        >
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute right-4 bottom-0 h-28 w-28 rounded-full bg-white/5 blur-xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-brand-200 text-sm font-medium">Good day</p>
              <h1 className="text-2xl font-bold mt-0.5">Welcome back, {firstName} 👋</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge variant={statusCfg.variant} className="text-xs">
                  {statusCfg.label}
                </Badge>
                {profile?.bloodGroup && (
                  <BloodGroupBadge group={profile.bloodGroup} />
                )}
                {profile?.daysUntilAvailable > 0 && (
                  <span className="text-xs text-brand-200">{profile.daysUntilAvailable} days until eligible</span>
                )}
              </div>
            </div>
            <div className="hidden sm:block text-4xl select-none">🩸</div>
          </div>
        </motion.div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            {
              title: 'Total Donations',
              value: donationCount,
              icon: <Activity className="h-5 w-5 text-brand-600" />,
              accentColor: '#be123c',
              accentBg: 'bg-brand-50',
              href: '/donor/donations',
              sparkData: trendData.map((d) => d.value),
            },
            {
              title: 'Lives Impacted',
              value: donationCount * 3,
              icon: <HeartPulse className="h-5 w-5 text-rose-500" />,
              accentColor: '#f43f5e',
              accentBg: 'bg-rose-50',
              suffix: '×',
            },
            {
              title: 'Active Pledges',
              value: profile?.activePledgeCount ?? 0,
              icon: <Droplets className="h-5 w-5 text-amber-500" />,
              accentColor: '#d97706',
              accentBg: 'bg-amber-50',
              href: '/donor/pledges',
            },
            {
              title: 'Certificates',
              value: profile?.certificateCount ?? 0,
              icon: <Award className="h-5 w-5 text-emerald-500" />,
              accentColor: '#059669',
              accentBg: 'bg-emerald-50',
              href: '/donor/certificates',
            },
          ].map((card, i) => (
            <motion.div key={card.title} {...MOTION_FADE_UP} {...staggerChild(i)}>
              <KPICard {...card} className="h-full" />
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Donation trend chart */}
          <SectionCard title="Donation History" className="lg:col-span-2" accentColor="#be123c">
            <AreaTrend
              data={trendData}
              xKey="label"
              yKey="value"
              color="#be123c"
              valueLabel="Donations"
              height={180}
            />
          </SectionCard>

          {/* Milestones */}
          <SectionCard title="Milestones" accentColor="#d97706">
            <div className="space-y-2">
              {MILESTONES.map((m) => {
                const earned = donationCount >= m.threshold
                return (
                  <div
                    key={m.label}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      earned ? 'bg-brand-50' : 'bg-slate-50 opacity-50'
                    }`}
                  >
                    <span className="text-xl">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${earned ? 'text-brand-700' : 'text-slate-500'}`}>
                        {m.label}
                      </p>
                      <p className="text-xs text-slate-400">{m.threshold} donation{m.threshold !== 1 ? 's' : ''}</p>
                    </div>
                    {earned && <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />}
                  </div>
                )
              })}
            </div>
          </SectionCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Matched requests */}
          <SectionCard title="Active Matches" action="View all" actionTo="/donor/feed" accentColor="#be123c">
            {fLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : feed.length === 0 ? (
              <EmptyMascot
                size="sm"
                title="All quiet right now"
                description="You're saved as available — requests matching your profile will appear here."
              />
            ) : (
              <div className="space-y-3">
                {feed.slice(0, 3).map((req) => (
                  <FeedCard key={req._id} req={req} />
                ))}
              </div>
            )}
          </SectionCard>

          {/* Activity */}
          <SectionCard title="Recent Activity" accentColor="#059669">
            <ActivityFeed items={activityItems} emptyText="No activity yet — make your first donation!" />
          </SectionCard>
        </div>
      </div>
    </AppShell>
  )
}

function FeedCard({ req }) {
  const fulfilled = req.unitsFulfilled ?? 0
  const total = req.unitsRequired ?? 1
  const pct = Math.round((fulfilled / total) * 100)

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="rounded-xl border border-slate-100 bg-slate-50 p-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <BloodGroupBadge group={req.bloodGroup} />
            <UrgencyBadge urgency={req.urgency} />
            {req.requiredBy && (
              <span className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(req.requiredBy), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-slate-700 truncate">
            {req.hospital?.name ?? 'Hospital'} · {req.hospital?.pincode}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">
              {req.unitsRequired} unit{req.unitsRequired !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0 text-xs h-7 px-2.5">
          <Link to="/donor/feed">Accept</Link>
        </Button>
      </div>
    </motion.div>
  )
}
