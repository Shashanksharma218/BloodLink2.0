import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Droplets, Search, ExternalLink } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { TableSkeleton } from '@/components/shared/LoadingState'
import {
  getStates,
  getDistricts,
  getBloodGroups,
  getComponents,
  getAvailability,
} from '@/services/endpoints/eraktkosh'

// Whole Blood is the most-searched component — pick it as the default
// when the master list loads so the form is closer to "ready to submit".
const PREFERRED_DEFAULT_COMPONENT = 'Whole Blood'

export default function Inventory() {
  const [stateCode, setStateCode] = useState('')
  const [districtCode, setDistrictCode] = useState('')
  const [bloodGroupCode, setBloodGroupCode] = useState('')
  const [componentCode, setComponentCode] = useState('')

  // Submitted filter — only set when user clicks Search.
  const [submitted, setSubmitted] = useState(null)

  const statesQuery = useQuery({
    queryKey: ['eraktkosh', 'states'],
    queryFn: getStates,
    staleTime: 1000 * 60 * 60,
  })
  const districtsQuery = useQuery({
    queryKey: ['eraktkosh', 'districts', stateCode],
    queryFn: () => getDistricts(stateCode),
    enabled: !!stateCode,
    staleTime: 1000 * 60 * 60,
  })
  const bloodGroupsQuery = useQuery({
    queryKey: ['eraktkosh', 'blood-groups'],
    queryFn: getBloodGroups,
    staleTime: 1000 * 60 * 60,
  })
  const componentsQuery = useQuery({
    queryKey: ['eraktkosh', 'components'],
    queryFn: getComponents,
    staleTime: 1000 * 60 * 60,
  })

  // Reset district when state changes.
  useEffect(() => { setDistrictCode('') }, [stateCode])

  // Auto-select Whole Blood once components load.
  useEffect(() => {
    if (componentCode || !componentsQuery.data) return
    const wholeBlood = componentsQuery.data.find((c) => c.name === PREFERRED_DEFAULT_COMPONENT)
    if (wholeBlood) setComponentCode(wholeBlood.code)
  }, [componentsQuery.data, componentCode])

  const availabilityQuery = useQuery({
    queryKey: ['eraktkosh', 'availability', submitted],
    queryFn: () => getAvailability(submitted),
    enabled: !!submitted,
    staleTime: 1000 * 60, // results are live; brief cache to avoid double-fire
  })

  const canSubmit = stateCode && districtCode && bloodGroupCode && componentCode
  const handleSubmit = (e) => {
    e.preventDefault()
    if (!canSubmit) return
    setSubmitted({ stateCode, districtCode, bloodGroupCode, componentCode })
  }

  const selectedLabels = useMemo(() => {
    if (!submitted) return null
    const state = statesQuery.data?.find((s) => s.stateCode === submitted.stateCode)
    const district = districtsQuery.data?.find((d) => d.districtCode === submitted.districtCode)
    const bg = bloodGroupsQuery.data?.find((b) => b.code === submitted.bloodGroupCode)
    const comp = componentsQuery.data?.find((c) => c.code === submitted.componentCode)
    return {
      state: state?.stateName,
      district: district?.districtName,
      bloodGroup: bg?.name,
      component: comp?.name,
    }
  }, [submitted, statesQuery.data, districtsQuery.data, bloodGroupsQuery.data, componentsQuery.data])

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blood Inventory</h1>
          <p className="mt-1 text-sm text-slate-500">
            Live blood stock at registered blood centres across India, sourced from{' '}
            <a
              href="https://eraktkosh.mohfw.gov.in/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-brand-600 hover:underline"
            >
              eRaktKosh <ExternalLink className="h-3 w-3" />
            </a>
            .
          </p>
        </div>

        <Card>
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
              <Field label="State">
                <Select
                  value={stateCode}
                  onChange={(e) => setStateCode(e.target.value)}
                  disabled={statesQuery.isLoading}
                >
                  <option value="">Select state…</option>
                  {(statesQuery.data ?? []).map((s) => (
                    <option key={s.stateCode} value={s.stateCode}>{s.stateName}</option>
                  ))}
                </Select>
              </Field>

              <Field label="District">
                <Select
                  value={districtCode}
                  onChange={(e) => setDistrictCode(e.target.value)}
                  disabled={!stateCode || districtsQuery.isLoading}
                >
                  <option value="">{stateCode ? 'Select district…' : 'Pick a state first'}</option>
                  {(districtsQuery.data ?? []).map((d) => (
                    <option key={d.districtCode} value={d.districtCode}>{d.districtName}</option>
                  ))}
                </Select>
              </Field>

              <Field label="Blood Group">
                <Select
                  value={bloodGroupCode}
                  onChange={(e) => setBloodGroupCode(e.target.value)}
                  disabled={bloodGroupsQuery.isLoading}
                >
                  <option value="">Select group…</option>
                  {(bloodGroupsQuery.data ?? []).map((bg) => (
                    <option key={bg.code} value={bg.code}>
                      {bg.localBloodGroup ?? bg.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Component">
                <Select
                  value={componentCode}
                  onChange={(e) => setComponentCode(e.target.value)}
                  disabled={componentsQuery.isLoading}
                >
                  <option value="">Select component…</option>
                  {(componentsQuery.data ?? []).map((c) => (
                    <option key={c.code} value={c.code}>{c.name}</option>
                  ))}
                </Select>
              </Field>

              <Field label="&nbsp;">
                <Button type="submit" disabled={!canSubmit || availabilityQuery.isFetching} className="w-full">
                  <Search className="h-4 w-4" />
                  {availabilityQuery.isFetching ? 'Searching…' : 'Search'}
                </Button>
              </Field>
            </form>
          </CardContent>
        </Card>

        {!submitted && (
          <EmptyState
            icon={Droplets}
            title="Pick filters above to search"
            description="Choose a state, district, blood group and component, then hit Search to see live stock."
          />
        )}

        {submitted && availabilityQuery.isLoading && (
          <Card>
            <CardContent className="p-0">
              <TableSkeleton rows={6} />
            </CardContent>
          </Card>
        )}

        {submitted && availabilityQuery.isError && (
          <ErrorState
            message={availabilityQuery.error?.message ?? 'Failed to load availability'}
            onRetry={() => availabilityQuery.refetch()}
          />
        )}

        {submitted && availabilityQuery.data && (
          <ResultsSection
            data={availabilityQuery.data}
            labels={selectedLabels}
          />
        )}
      </div>
    </AppShell>
  )
}

function Field({ label, children }) {
  return (
    <label className="space-y-1.5">
      <span
        className="block text-xs font-medium uppercase tracking-wide text-slate-500"
        dangerouslySetInnerHTML={{ __html: label }}
      />
      {children}
    </label>
  )
}

function ResultsSection({ data, labels }) {
  const { count, results } = data
  const availableCount = results.filter((r) => r.available).length

  if (count === 0) {
    return (
      <EmptyState
        icon={Droplets}
        title="No blood centres found"
        description={`eRaktKosh has no centres listed for ${labels?.district ?? 'this district'} with the chosen filters.`}
      />
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Badge variant="outline">
          {labels?.state} · {labels?.district}
        </Badge>
        <Badge variant="outline">{labels?.bloodGroup}</Badge>
        <Badge variant="outline">{labels?.component}</Badge>
        <span className="ml-auto text-xs text-slate-500">
          {availableCount} of {count} centre{count === 1 ? '' : 's'} have stock
        </span>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Blood centre</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Units</TableHead>
                <TableHead>Last updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((row, idx) => (
                <ResultRow key={`${row.hospital.code}-${idx}`} row={row} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ResultRow({ row }) {
  const groupLabel = row.bloodGroup.local ?? row.bloodGroup.raw

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium text-slate-800">{row.hospital.name}</div>
        <div className="mt-0.5 text-xs text-slate-500">{row.hospital.address}</div>
        {row.hospital.contact && (
          <div className="mt-0.5 text-xs text-slate-400">{row.hospital.contact}</div>
        )}
      </TableCell>
      <TableCell>
        {row.hospital.type && (
          <Badge variant={row.hospital.type === 'Govt.' ? 'info' : 'outline'}>
            {row.hospital.type}
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {groupLabel && <BloodGroupBadge group={groupLabel} />}
      </TableCell>
      <TableCell className="text-right">
        {row.available ? (
          <span className="font-bold text-emerald-700">{row.units}</span>
        ) : (
          <span className="text-slate-400">Not available</span>
        )}
      </TableCell>
      <TableCell className="text-xs text-slate-500">
        {row.lastUpdated ? format(new Date(row.lastUpdated), 'd MMM, HH:mm') : '—'}
      </TableCell>
    </TableRow>
  )
}
