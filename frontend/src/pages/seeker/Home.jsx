import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PlusCircle, ChevronRight } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RequestStatusBadge } from '@/components/shared/RequestStatusBadge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState, CardSkeleton } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getMyRequests } from '@/services/endpoints/seeker'
import { useAuth } from '@/context/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { REQUEST_STATUS } from '@/lib/enums'

const ACTIVE_STATUSES = [
  REQUEST_STATUS.PENDING_VERIFICATION,
  REQUEST_STATUS.VERIFIED,
  REQUEST_STATUS.PARTIALLY_FULFILLED,
]

export default function SeekerHome() {
  const { account } = useAuth()

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seeker', 'requests', { active: true }],
    queryFn: () => getMyRequests({ limit: 10 }),
    staleTime: 0,
  })

  const allRequests = data?.requests ?? data ?? []
  const active = allRequests.filter((r) => ACTIVE_STATUSES.includes(r.status))

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Welcome, {account?.name?.split(' ')[0]}
            </h1>
            <p className="mt-1 text-sm text-slate-500">Manage your blood requests</p>
          </div>
          <Button asChild size="sm">
            <Link to="/seeker/requests/new">
              <PlusCircle className="h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Active Requests</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/seeker/requests">All requests <ChevronRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>

          {isLoading && <div className="space-y-3"><CardSkeleton /><CardSkeleton /></div>}
          {isError && <ErrorState message={error.message} onRetry={refetch} />}

          {!isLoading && !isError && active.length === 0 && (
            <EmptyState
              title="No active requests"
              description="Create a blood request to get matched with nearby donors."
              action={{ label: 'Create request', onClick: () => {} }}
            />
          )}

          {!isLoading && !isError && active.map((req) => (
            <RequestCard key={req._id} req={req} />
          ))}
        </div>
      </div>
    </AppShell>
  )
}

function RequestCard({ req }) {
  const fulfilled = req.unitsFulfilled ?? 0
  const total = req.unitsRequired ?? 1
  const pct = Math.round((fulfilled / total) * 100)

  return (
    <Link to={`/seeker/requests/${req._id}`}>
      <Card className="mt-3 hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <BloodGroupBadge group={req.bloodGroup} />
                <UrgencyBadge urgency={req.urgency} />
                <RequestStatusBadge status={req.status} />
              </div>
              <p className="text-sm font-medium text-slate-800">
                {req.patient?.name ?? 'Patient'} · {req.hospital?.name ?? 'Hospital'}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full bg-brand-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {fulfilled}/{total} units
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 mt-1 flex-shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
