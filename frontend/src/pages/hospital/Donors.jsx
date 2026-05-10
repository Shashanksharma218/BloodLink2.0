import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar, ChevronLeft, ChevronRight, Heart, Mail,
  MapPin, Phone, Search, Users, X,
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getNearbyDonors, getDonorHistory } from '@/services/endpoints/hospital'
import { cn } from '@/utils/cn'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']
const STATUS_OPTIONS = ['AVAILABLE', 'RECOVERING', 'UNAVAILABLE', 'INELIGIBLE']

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

const STATUS_VARIANT = {
  AVAILABLE: 'success',
  RECOVERING: 'warning',
  UNAVAILABLE: 'default',
  INELIGIBLE: 'danger',
}
const STATUS_LABEL = {
  AVAILABLE: 'Available',
  RECOVERING: 'Recovering',
  UNAVAILABLE: 'Unavailable',
  INELIGIBLE: 'Ineligible',
}

function DonorStatusBadge({ status, daysUntilAvailable }) {
  const variant = STATUS_VARIANT[status] ?? 'default'
  const label = STATUS_LABEL[status] ?? status
  const suffix =
    status === 'RECOVERING' && daysUntilAvailable
      ? ` · ${daysUntilAvailable}d left`
      : ''
  return <Badge variant={variant}>{label}{suffix}</Badge>
}

export default function HospitalDonors() {
  const [page, setPage] = useState(1)
  const limit = 20
  const [bloodGroup, setBloodGroup] = useState(null)
  const [status, setStatus] = useState(null)
  const [searchInput, setSearchInput] = useState('')
  const search = useDebouncedValue(searchInput, 300)
  const [selectedDonorId, setSelectedDonorId] = useState(null)

  // Reset to page 1 whenever filters change.
  useEffect(() => { setPage(1) }, [bloodGroup, status, search])

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hospital', 'donors', { page, bloodGroup, status, search }],
    queryFn: () => getNearbyDonors({
      page,
      limit,
      ...(bloodGroup ? { bloodGroup } : {}),
      ...(status ? { status } : {}),
      ...(search ? { search } : {}),
    }),
    staleTime: 30_000,
  })

  const donors = data?.donors ?? []
  const total = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const stats = useMemo(() => {
    const out = { total: donors.length, AVAILABLE: 0, RECOVERING: 0, UNAVAILABLE: 0, INELIGIBLE: 0 }
    for (const d of donors) out[d.effectiveStatus] = (out[d.effectiveStatus] ?? 0) + 1
    return out
  }, [donors])

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Donors in your area</h1>
            <p className="mt-1 text-sm text-slate-500">
              Enrolled donors registered to your hospital&rsquo;s pincode.
            </p>
          </div>
          <Badge variant="outline" className="text-sm">
            <Users className="h-3.5 w-3.5" />
            {total} total
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="On this page" value={stats.total} tone="slate" />
          <StatCard label="Available" value={stats.AVAILABLE} tone="emerald" />
          <StatCard label="Recovering" value={stats.RECOVERING} tone="amber" />
          <StatCard label="Unavailable" value={stats.UNAVAILABLE + stats.INELIGIBLE} tone="slate" />
        </div>

        <Card>
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative w-full lg:max-w-sm">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by name, phone or email"
                  className="pl-9"
                />
              </div>
              {(bloodGroup || status || searchInput) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setBloodGroup(null); setStatus(null); setSearchInput('') }}
                >
                  <X className="h-3.5 w-3.5" />
                  Clear filters
                </Button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Blood</span>
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup((cur) => (cur === bg ? null : bg))}
                  className={cn(
                    'transition-opacity',
                    bloodGroup && bloodGroup !== bg && 'opacity-40 hover:opacity-70',
                    bloodGroup === bg && 'ring-2 ring-offset-1 ring-brand-400 rounded-full',
                  )}
                >
                  <BloodGroupBadge group={bg} />
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Status</span>
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus((cur) => (cur === s ? null : s))}
                  className={cn(
                    'transition-opacity',
                    status && status !== s && 'opacity-40 hover:opacity-70',
                    status === s && 'ring-2 ring-offset-1 ring-brand-400 rounded-full',
                  )}
                >
                  <DonorStatusBadge status={s} />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {isLoading && <LoadingState />}
        {isError && <ErrorState message={error.message} onRetry={refetch} />}

        {!isLoading && !isError && donors.length === 0 && (
          <EmptyState
            icon={Users}
            title="No donors match"
            description={
              bloodGroup || status || search
                ? 'Try clearing some filters to widen the search.'
                : 'No enrolled donors are registered to your pincode yet.'
            }
          />
        )}

        {!isLoading && !isError && donors.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pincode</TableHead>
                    <TableHead>Last donated</TableHead>
                    <TableHead className="text-right">Donations</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donors.map((d) => (
                    <TableRow
                      key={d._id}
                      className="cursor-pointer"
                      onClick={() => setSelectedDonorId(d._id)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800">{d.name}</span>
                          <BloodGroupBadge group={d.bloodGroup} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <DonorStatusBadge
                          status={d.effectiveStatus}
                          daysUntilAvailable={d.daysUntilAvailable}
                        />
                      </TableCell>
                      <TableCell className="text-slate-600">{d.pincode}</TableCell>
                      <TableCell className="text-slate-600">
                        {d.lastDonationDate
                          ? formatDistanceToNow(new Date(d.lastDonationDate), { addSuffix: true })
                          : <span className="text-slate-400">Never</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700">
                        {d.donationsCount ?? 0}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex flex-col gap-0.5 text-xs">
                          {d.phone && (
                            <a
                              href={`tel:${d.phone}`}
                              className="inline-flex items-center gap-1 text-brand-600 hover:underline"
                            >
                              <Phone className="h-3 w-3" />{d.phone}
                            </a>
                          )}
                          {d.email && (
                            <a
                              href={`mailto:${d.email}`}
                              className="inline-flex items-center gap-1 text-slate-500 hover:text-brand-600 hover:underline"
                            >
                              <Mail className="h-3 w-3" />
                              <span className="truncate max-w-[180px]">{d.email}</span>
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setSelectedDonorId(d._id) }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
                  <p className="text-xs text-slate-500">
                    Page {page} of {totalPages} · {total} donor{total === 1 ? '' : 's'}
                  </p>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Prev
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <DonorDetailDialog
        donorId={selectedDonorId}
        onClose={() => setSelectedDonorId(null)}
      />
    </AppShell>
  )
}

function StatCard({ label, value, tone = 'slate' }) {
  const toneClasses = {
    slate: 'text-slate-700 bg-slate-50',
    emerald: 'text-emerald-700 bg-emerald-50',
    amber: 'text-amber-700 bg-amber-50',
  }[tone] ?? 'text-slate-700 bg-slate-50'

  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className={cn('inline-flex h-9 min-w-[2.25rem] items-center justify-center rounded-md px-2 text-xl font-bold', toneClasses)}>
            {value}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

function DonorDetailDialog({ donorId, onClose }) {
  const open = !!donorId
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['hospital', 'donor-history', donorId],
    queryFn: () => getDonorHistory(donorId),
    enabled: open,
  })

  const donor = data?.donor
  const donations = data?.donations ?? []

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl">
        {isLoading && <p className="py-8 text-center text-sm text-slate-500">Loading donor…</p>}
        {isError && (
          <p className="py-8 text-center text-sm text-red-600">
            {error?.message ?? 'Failed to load donor'}
          </p>
        )}
        {donor && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 pr-8">
                <DialogTitle>{donor.name}</DialogTitle>
                <BloodGroupBadge group={donor.bloodGroup} />
                <DonorStatusBadge
                  status={donor.effectiveStatus}
                  daysUntilAvailable={donor.daysUntilAvailable}
                />
              </div>
            </DialogHeader>

            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {donor.phone && (
                  <ContactRow icon={Phone} href={`tel:${donor.phone}`} value={donor.phone} />
                )}
                {donor.email && (
                  <ContactRow icon={Mail} href={`mailto:${donor.email}`} value={donor.email} />
                )}
                <ContactRow icon={MapPin} value={`Pincode ${donor.pincode}`} />
                <ContactRow
                  icon={Calendar}
                  value={`Member since ${format(new Date(donor.createdAt), 'MMM yyyy')}`}
                />
              </div>

              <div className="rounded-lg bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Total donations</span>
                  <span className="font-semibold text-slate-800">{donor.donationsCount ?? 0}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-slate-500">Last donated</span>
                  <span className="font-medium text-slate-700">
                    {donor.lastDonationDate
                      ? formatDistanceToNow(new Date(donor.lastDonationDate), { addSuffix: true })
                      : 'Never'}
                  </span>
                </div>
                {donor.availabilityPreference === 'UNAVAILABLE' && donor.manualUnavailableReason && (
                  <div className="mt-2 border-t border-slate-200 pt-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-600">Note:</span>{' '}
                    {donor.manualUnavailableReason}
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 text-sm font-semibold text-slate-700">Donation history</h3>
                {donations.length === 0 ? (
                  <div className="rounded-md border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                    No donations recorded yet.
                  </div>
                ) : (
                  <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                    {donations.map((don) => (
                      <li key={don._id} className="relative">
                        <span className="absolute -left-[27px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-100 ring-4 ring-white">
                          <Heart className="h-2.5 w-2.5 text-brand-600" />
                        </span>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-medium text-slate-800">
                            {format(new Date(don.donatedAt), 'd MMM yyyy')}
                          </span>
                          <Badge variant={don.state === 'VERIFIED' ? 'success' : don.state === 'REJECTED' ? 'danger' : 'info'}>
                            {don.state ?? 'RECORDED'}
                          </Badge>
                          {don.request?.urgency && <UrgencyBadge urgency={don.request.urgency} />}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {don.hospital?.name ?? 'Unknown hospital'}
                          {don.hospital?.pincode ? ` · ${don.hospital.pincode}` : ''}
                          {' · '}
                          {don.units ?? 1} unit{(don.units ?? 1) === 1 ? '' : 's'}
                          {don.donationType ? ` · ${don.donationType.replace('_', ' ').toLowerCase()}` : ''}
                        </p>
                        {don.notes && (
                          <p className="mt-1 text-xs italic text-slate-500">&ldquo;{don.notes}&rdquo;</p>
                        )}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ContactRow({ icon: Icon, value, href }) {
  const inner = (
    <span className="inline-flex items-center gap-2 text-sm text-slate-700">
      <Icon className="h-3.5 w-3.5 text-slate-400" />
      {value}
    </span>
  )
  if (!href) return <div>{inner}</div>
  return (
    <a href={href} className="hover:text-brand-600 hover:underline">
      {inner}
    </a>
  )
}
