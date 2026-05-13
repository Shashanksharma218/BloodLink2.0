import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DonationStateBadge } from '@/components/shared/DonationStateBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState, TableSkeleton } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Pagination } from '@/components/ui/pagination'
import { getDonations } from '@/services/endpoints/donor'
import { BloodDropIcon } from '@/components/shared/BloodDropIcon'

export default function DonorDonations() {
  const [page, setPage] = useState(1)
  const [detail, setDetail] = useState(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['donor', 'donations', { page }],
    queryFn: () => getDonations({ page, limit: 15 }),
  })

  const donations = data?.donations ?? data ?? []
  const meta = data?.meta ?? {}

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Donation History</h1>

        {isLoading && <TableSkeleton />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && donations.length === 0 && (
          <EmptyState
            icon={BloodDropIcon}
            title="No donations yet"
            description="Once you donate, your history will appear here."
          />
        )}

        {!isLoading && !isError && donations.length > 0 && (
          <>
            {/* Mobile: card list */}
            <div className="md:hidden space-y-3">
              {donations.map((d) => (
                <div
                  key={d._id}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 cursor-pointer hover:bg-slate-50"
                  onClick={() => setDetail(d)}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="text-sm font-medium text-slate-800">
                      {format(new Date(d.donatedAt), 'dd MMM yyyy')}
                    </p>
                    <DonationStateBadge state={d.state} />
                  </div>
                  <dl className="text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Type</dt>
                      <dd>{d.donationType?.replace('_', ' ') ?? '—'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Units</dt>
                      <dd>{d.units}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-400">Hospital</dt>
                      <dd className="text-right truncate max-w-40">{d.hospital?.name ?? '—'}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>

            {/* Desktop: table */}
            <div className="hidden md:block rounded-xl border border-slate-200 bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>State</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((d) => (
                    <TableRow
                      key={d._id}
                      className="cursor-pointer"
                      onClick={() => setDetail(d)}
                    >
                      <TableCell>{format(new Date(d.donatedAt), 'dd MMM yyyy')}</TableCell>
                      <TableCell>{d.donationType?.replace('_', ' ')}</TableCell>
                      <TableCell>{d.units}</TableCell>
                      <TableCell>{d.hospital?.name ?? '—'}</TableCell>
                      <TableCell><DonationStateBadge state={d.state} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}

        <Pagination page={page} total={meta.total ?? 0} limit={15} onPageChange={setPage} />
      </div>

      {/* Detail modal */}
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        {detail && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Donation Details</DialogTitle>
            </DialogHeader>
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Date" value={format(new Date(detail.donatedAt), 'dd MMM yyyy, h:mm a')} />
              <Row label="Type" value={detail.donationType?.replace('_', ' ')} />
              <Row label="Units" value={detail.units} />
              <Row label="Hospital" value={detail.hospital?.name} />
              <Row label="State" value={<DonationStateBadge state={detail.state} />} />
              {detail.notes && <Row label="Notes" value={detail.notes} />}
              {detail.state === 'REJECTED' && detail.rejectionReason && (
                <Row label="Rejection reason" value={detail.rejectionReason} />
              )}
            </dl>
          </DialogContent>
        )}
      </Dialog>
    </AppShell>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 py-2.5">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800 font-medium text-right">{value ?? '—'}</dd>
    </div>
  )
}
