import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, ChevronRight, List } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Button } from '@/components/ui/button'
import { RequestStatusBadge } from '@/components/shared/RequestStatusBadge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Pagination } from '@/components/ui/pagination'
import { EmptyMascot } from '@/components/dashboard/EmptyMascot'
import { getMyRequests } from '@/services/endpoints/seeker'
import { formatDistanceToNow } from 'date-fns'
import { REQUEST_STATUS } from '@/lib/enums'
import { MOTION_FADE_UP } from '@/components/dashboard/theme'

const STATUS_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: REQUEST_STATUS.PENDING_VERIFICATION },
  { label: 'Verified', value: REQUEST_STATUS.VERIFIED },
  { label: 'Active', value: REQUEST_STATUS.PARTIALLY_FULFILLED },
  { label: 'Fulfilled', value: REQUEST_STATUS.FULFILLED },
]

const STATUS_BORDER = {
  [REQUEST_STATUS.PENDING_VERIFICATION]: 'border-l-amber-400',
  [REQUEST_STATUS.VERIFIED]: 'border-l-emerald-400',
  [REQUEST_STATUS.PARTIALLY_FULFILLED]: 'border-l-brand-400',
  [REQUEST_STATUS.FULFILLED]: 'border-l-emerald-600',
  [REQUEST_STATUS.REJECTED]: 'border-l-red-400',
  [REQUEST_STATUS.CANCELLED]: 'border-l-slate-300',
  [REQUEST_STATUS.EXPIRED]: 'border-l-slate-300',
}

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
        <motion.div {...MOTION_FADE_UP} className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
              <List className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">My Requests</h1>
              <p className="text-sm text-slate-500">{meta.total ?? 0} total requests</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/seeker/requests/new">
              <PlusCircle className="h-4 w-4" />
              New Request
            </Link>
          </Button>
        </motion.div>

        {/* Status filters */}
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <motion.button
              key={f.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => { setStatus(f.value); setPage(1) }}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-all ${
                status === f.value
                  ? 'border-amber-600 bg-amber-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </motion.button>
          ))}
        </div>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && requests.length === 0 && (
          <EmptyMascot
            title="No requests found"
            description="Try a different filter or create a new blood request."
            action="Create request"
            actionTo="/seeker/requests/new"
          />
        )}

        <AnimatePresence mode="wait">
          {!isLoading && !isError && requests.length > 0 && (
            <motion.div
              key={`${status}-${page}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {requests.map((req, i) => (
                <motion.div
                  key={req._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/seeker/requests/${req._id}`}>
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      className={`rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden border-l-4 ${STATUS_BORDER[req.status] ?? 'border-l-slate-200'} hover:border-amber-200 transition-colors`}
                    >
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <BloodGroupBadge group={req.bloodGroup} />
                              <UrgencyBadge urgency={req.urgency} />
                              <RequestStatusBadge status={req.status} />
                            </div>
                            <p className="text-sm font-semibold text-slate-800">
                              {req.patient?.name} · {req.hospital?.name}
                            </p>
                            {req.unitsRequired && (
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full bg-amber-500 transition-all"
                                    style={{ width: `${Math.min(100, Math.round(((req.unitsFulfilled ?? 0) / req.unitsRequired) * 100))}%` }}
                                  />
                                </div>
                                <span className="text-xs text-slate-500 whitespace-nowrap">
                                  {req.unitsFulfilled ?? 0}/{req.unitsRequired} units
                                </span>
                              </div>
                            )}
                            <p className="text-xs text-slate-400">
                              {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
                        </div>
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <Pagination page={page} total={meta.total ?? 0} limit={10} onPageChange={setPage} />
      </div>
    </AppShell>
  )
}
