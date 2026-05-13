import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Search, User, HeartPulse } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'
import { recordDonation, getAcceptedPledges, getNearbyDonors } from '@/services/endpoints/hospital'
import { DONATION_TYPE } from '@/lib/enums'

const schema = z.object({
  pledgeId: z.string().optional(),
  donorId: z.string().optional(),
  donationType: z.enum(['WHOLE_BLOOD', 'PLASMA', 'PLATELETS']),
  units: z.coerce.number().int().min(1).max(10),
  donatedAt: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => d.pledgeId || d.donorId, {
  message: 'Select a pledge or a walk-in donor',
  path: ['pledgeId'],
})

function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function HospitalRecordDonation() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const pledgeIdFromUrl = params.get('pledgeId')

  const [tab, setTab] = useState(pledgeIdFromUrl ? 'pledge' : 'pledge')
  const [pledgeSearch, setPledgeSearch] = useState('')
  const [donorSearch, setDonorSearch] = useState('')
  const [selectedPledge, setSelectedPledge] = useState(null)
  const [selectedDonor, setSelectedDonor] = useState(null)

  const debouncedPledgeSearch = useDebouncedValue(pledgeSearch)
  const debouncedDonorSearch = useDebouncedValue(donorSearch)

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      pledgeId: pledgeIdFromUrl ?? '',
      donorId: '',
      donationType: 'WHOLE_BLOOD',
      units: 1,
      donatedAt: new Date().toISOString().slice(0, 16),
      notes: '',
    },
  })

  const { data: pledgesData, isLoading: pledgesLoading } = useQuery({
    queryKey: ['hospital', 'pledges', 'accepted', debouncedPledgeSearch],
    queryFn: () => getAcceptedPledges({ search: debouncedPledgeSearch, limit: 20 }),
    staleTime: 30_000,
  })

  const { data: donorsData, isLoading: donorsLoading } = useQuery({
    queryKey: ['hospital', 'donors', { search: debouncedDonorSearch }],
    queryFn: () => getNearbyDonors({ search: debouncedDonorSearch, limit: 20 }),
    enabled: tab === 'walkin',
    staleTime: 30_000,
  })

  const pledges = pledgesData?.pledges ?? []
  const donors = donorsData?.donors ?? []

  useEffect(() => {
    if (pledgeIdFromUrl && pledges.length) {
      const match = pledges.find((p) => p._id === pledgeIdFromUrl)
      if (match) {
        setSelectedPledge(match)
        form.setValue('pledgeId', match._id)
      }
    }
  }, [pledgeIdFromUrl, pledges])

  const onSelectPledge = (pledge) => {
    setSelectedPledge(pledge)
    setSelectedDonor(null)
    form.setValue('pledgeId', pledge._id)
    form.setValue('donorId', '')
  }

  const onSelectDonor = (donor) => {
    setSelectedDonor(donor)
    setSelectedPledge(null)
    form.setValue('donorId', donor._id)
    form.setValue('pledgeId', '')
  }

  const onTabChange = (t) => {
    setTab(t)
    setSelectedPledge(null)
    setSelectedDonor(null)
    form.setValue('pledgeId', '')
    form.setValue('donorId', '')
  }

  const { mutate, isPending } = useMutation({
    mutationFn: recordDonation,
    onSuccess: () => {
      toast.success('Donation recorded. Pending verification.')
      qc.invalidateQueries({ queryKey: ['hospital', 'donations'] })
      navigate('/hospital/donations')
    },
    onError: (err) => toast.error(err.message),
  })

  const pledgeError = form.formState.errors.pledgeId?.message

  return (
    <AppShell>
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Record Donation</h1>

        <form onSubmit={form.handleSubmit((d) => mutate({
          ...d,
          pledgeId: d.pledgeId || undefined,
          donorId: d.donorId || undefined,
          donatedAt: d.donatedAt || undefined,
          notes: d.notes || undefined,
        }))}>
          <div className="space-y-4">
            {/* Donor selector */}
            <Card>
              <CardHeader><CardTitle>Select Donor</CardTitle></CardHeader>
              <CardContent>
                <Tabs value={tab} onValueChange={onTabChange}>
                  <TabsList className="mb-4">
                    <TabsTrigger value="pledge">
                      <HeartPulse className="h-3.5 w-3.5 mr-1.5" />
                      From a pledge
                    </TabsTrigger>
                    <TabsTrigger value="walkin">
                      <User className="h-3.5 w-3.5 mr-1.5" />
                      Walk-in
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pledge" className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        value={pledgeSearch}
                        onChange={(e) => setPledgeSearch(e.target.value)}
                        placeholder="Search by donor or patient name…"
                        className="pl-9"
                      />
                    </div>

                    {selectedPledge && (
                      <SelectedCard
                        label="Selected pledge"
                        primary={selectedPledge.donor?.name ?? 'Donor'}
                        secondary={`Patient: ${selectedPledge.request?.patient?.name ?? '—'} · ${formatDistanceToNow(new Date(selectedPledge.createdAt), { addSuffix: true })}`}
                        bloodGroup={selectedPledge.donor?.bloodGroup}
                        onClear={() => { setSelectedPledge(null); form.setValue('pledgeId', '') }}
                      />
                    )}

                    {!selectedPledge && (
                      <div className="max-h-60 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
                        {pledgesLoading && (
                          <p className="py-6 text-center text-sm text-slate-500">Loading pledges…</p>
                        )}
                        {!pledgesLoading && pledges.length === 0 && (
                          <p className="py-6 text-center text-sm text-slate-500">
                            No accepted pledges found.
                          </p>
                        )}
                        {pledges.map((p) => (
                          <button
                            key={p._id}
                            type="button"
                            onClick={() => onSelectPledge(p)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">{p.donor?.name ?? 'Donor'}</p>
                              <p className="text-xs text-slate-500">
                                Patient: {p.request?.patient?.name ?? '—'}
                                {' · '}
                                {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {p.donor?.bloodGroup && <BloodGroupBadge group={p.donor.bloodGroup} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="walkin" className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      <Input
                        value={donorSearch}
                        onChange={(e) => setDonorSearch(e.target.value)}
                        placeholder="Search by name, phone or email…"
                        className="pl-9"
                      />
                    </div>

                    {selectedDonor && (
                      <SelectedCard
                        label="Selected donor"
                        primary={selectedDonor.name}
                        secondary={selectedDonor.phone ?? selectedDonor.email ?? ''}
                        bloodGroup={selectedDonor.bloodGroup}
                        onClear={() => { setSelectedDonor(null); form.setValue('donorId', '') }}
                      />
                    )}

                    {!selectedDonor && (
                      <div className="max-h-60 overflow-y-auto rounded-md border border-slate-200 divide-y divide-slate-100">
                        {!debouncedDonorSearch && (
                          <p className="py-6 text-center text-sm text-slate-500">
                            Type a name, phone, or email to search.
                          </p>
                        )}
                        {debouncedDonorSearch && donorsLoading && (
                          <p className="py-6 text-center text-sm text-slate-500">Searching…</p>
                        )}
                        {debouncedDonorSearch && !donorsLoading && donors.length === 0 && (
                          <p className="py-6 text-center text-sm text-slate-500">No donors found.</p>
                        )}
                        {donors.map((d) => (
                          <button
                            key={d._id}
                            type="button"
                            onClick={() => onSelectDonor(d)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 text-left"
                          >
                            <div>
                              <p className="text-sm font-medium text-slate-800">{d.name}</p>
                              <p className="text-xs text-slate-500">{d.phone ?? d.email ?? ''}</p>
                            </div>
                            {d.bloodGroup && <BloodGroupBadge group={d.bloodGroup} />}
                          </button>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {pledgeError && (
                  <p className="mt-2 text-xs text-red-600">{pledgeError}</p>
                )}
              </CardContent>
            </Card>

            {/* Donation details */}
            <Card>
              <CardHeader><CardTitle>Donation Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Donation type">
                    <Select {...form.register('donationType')}>
                      <option value={DONATION_TYPE.WHOLE_BLOOD}>Whole Blood</option>
                      <option value={DONATION_TYPE.PLASMA}>Plasma</option>
                      <option value={DONATION_TYPE.PLATELETS}>Platelets</option>
                    </Select>
                  </Field>
                  <Field label="Units">
                    <Input {...form.register('units')} type="number" min={1} max={10} />
                  </Field>
                </div>

                <Field label="Donated at">
                  <Input {...form.register('donatedAt')} type="datetime-local" />
                </Field>

                <Field label="Notes (optional)">
                  <Textarea {...form.register('notes')} rows={2} placeholder="Any observations…" />
                </Field>
              </CardContent>

              <CardFooter className="justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Record donation
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

function SelectedCard({ label, primary, secondary, bloodGroup, onClear }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-brand-600 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-slate-900">{primary}</p>
        {secondary && <p className="text-xs text-slate-500">{secondary}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {bloodGroup && <BloodGroupBadge group={bloodGroup} />}
        <Button type="button" variant="ghost" size="sm" onClick={onClear} className="h-7 px-2 text-xs">
          Change
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children, error, hint }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
