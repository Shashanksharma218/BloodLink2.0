import { useState } from 'react'
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
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Pagination } from '@/components/ui/pagination'
import { getMyRequests } from '@/services/endpoints/seeker'
import { formatDistanceToNow } from 'date-fns'
import { REQUEST_STATUS } from '@/lib/enums'

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: REQUEST_STATUS.PENDING_VERIFICATION },
  { label: 'Verified', value: REQUEST_STATUS.VERIFIED },
  { label: 'Active', value: REQUEST_STATUS.PARTIALLY_FULFILLED },
  { label: 'Fulfilled', value: REQUEST_STATUS.FULFILLED },
]

export default function SeekerRequestList() {
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seeker', 'requests', { status, page }],
    queryFn: () => getMyRequests({ status: status || undefined, page, limit: 10 }),
  })

  const requests = data?.requests ?? data ?? []
  const meta = data?.meta ?? {}

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
          <Button asChild size="sm">
            <Link to="/seeker/requests/new">
              <PlusCircle className="h-4 w-4" />
              New Request
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                status === f.value
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && requests.length === 0 && (
          <EmptyState title="No requests found" description="Try a different filter or create a new request." />
        )}

        {!isLoading && !isError && requests.length > 0 && (
          <div className="space-y-3">
            {requests.map((req) => (
              <Link key={req._id} to={`/seeker/requests/${req._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <BloodGroupBadge group={req.bloodGroup} />
                          <UrgencyBadge urgency={req.urgency} />
                          <RequestStatusBadge status={req.status} />
                        </div>
                        <p className="text-sm font-medium text-slate-800">
                          {req.patient?.name} · {req.hospital?.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <Pagination page={page} total={meta.total ?? 0} limit={10} onPageChange={setPage} />
      </div>
    </AppShell>
  )
}
