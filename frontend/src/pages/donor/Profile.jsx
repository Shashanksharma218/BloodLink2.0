import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getDonorProfile, updateDonorProfile } from '@/services/endpoints/donor'
import { BLOOD_GROUPS } from '@/lib/enums'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15),
  pincode: z.string().length(6),
  bloodGroup: z.string(),
  availabilityPreference: z.enum(['AVAILABLE', 'UNAVAILABLE']),
  manualUnavailableReason: z.string().optional(),
})

export default function DonorProfile() {
  const qc = useQueryClient()
  const [confirmUnenrollOpen, setConfirmUnenrollOpen] = useState(false)

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['donor', 'profile'],
    queryFn: getDonorProfile,
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      phone: '',
      pincode: '',
      bloodGroup: '',
      availabilityPreference: 'AVAILABLE',
      manualUnavailableReason: '',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        pincode: profile.pincode ?? '',
        bloodGroup: profile.bloodGroup ?? '',
        availabilityPreference: profile.availabilityPreference ?? 'AVAILABLE',
        manualUnavailableReason: profile.manualUnavailableReason ?? '',
      })
    }
  }, [profile])

  const { mutate, isPending } = useMutation({
    mutationFn: updateDonorProfile,
    onSuccess: () => {
      toast.success('Profile updated.')
      qc.invalidateQueries({ queryKey: ['donor', 'profile'] })
    },
    onError: (err) => toast.error(err.message),
  })

  const { mutate: unenroll, isPending: unenrolling } = useMutation({
    mutationFn: () => updateDonorProfile({ donorEnrolled: false }),
    onSuccess: () => {
      toast.success('You have left the donor program.')
      qc.invalidateQueries({ queryKey: ['donor', 'profile'] })
      setConfirmUnenrollOpen(false)
    },
    onError: (err) => toast.error(err.message),
  })

  const { mutate: reenroll, isPending: reenrolling } = useMutation({
    mutationFn: () => updateDonorProfile({ donorEnrolled: true }),
    onSuccess: () => {
      toast.success('Welcome back to the donor program!')
      qc.invalidateQueries({ queryKey: ['donor', 'profile'] })
    },
    onError: (err) => toast.error(err.message),
  })

  const pref = form.watch('availabilityPreference')

  if (isLoading) return <AppShell><LoadingState /></AppShell>
  if (isError) return <AppShell><ErrorState message={error.message} onRetry={refetch} /></AppShell>

  const enrolled = profile?.donorEnrolled ?? true

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Donor Profile</h1>

        <form onSubmit={form.handleSubmit((d) => mutate(d))}>
          <Card>
            <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" error={form.formState.errors.phone?.message}>
                  <Input {...form.register('phone')} type="tel" placeholder="10-digit mobile number" />
                </Field>
                <Field label="Pincode" error={form.formState.errors.pincode?.message}>
                  <Input {...form.register('pincode')} maxLength={6} placeholder="6-digit pincode" />
                </Field>
              </div>
              <Field label="Blood Group">
                <Select {...form.register('bloodGroup')}>
                  {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </Select>
              </Field>
            </CardContent>

            <CardHeader className="pt-0"><CardTitle>Availability</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Availability preference">
                <Select {...form.register('availabilityPreference')}>
                  <option value="AVAILABLE">Available</option>
                  <option value="UNAVAILABLE">Unavailable</option>
                </Select>
              </Field>
              {pref === 'UNAVAILABLE' && (
                <Field label="Reason (optional)">
                  <Textarea {...form.register('manualUnavailableReason')} placeholder="Travelling, health issue, etc." rows={2} />
                </Field>
              )}
            </CardContent>

            <CardFooter className="justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>

        {/* Donor program — separate card to prevent accidental opt-out */}
        <Card>
          <CardHeader>
            <CardTitle>Donor Program</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {enrolled ? 'You are enrolled as a blood donor.' : 'You have left the donor program.'}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {enrolled
                    ? 'Leaving removes you from match results and pauses all alerts.'
                    : 'Re-joining makes you visible to hospitals again.'}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant={enrolled ? 'success' : 'default'}>
                  {enrolled ? 'Enrolled' : 'Not enrolled'}
                </Badge>
                {enrolled ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => setConfirmUnenrollOpen(true)}
                  >
                    Leave program
                  </Button>
                ) : (
                  <Button size="sm" disabled={reenrolling} onClick={() => reenroll()}>
                    {reenrolling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Rejoin
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <ConfirmDialog
          open={confirmUnenrollOpen}
          onOpenChange={setConfirmUnenrollOpen}
          title="Leave the donor program?"
          description="You'll be removed from match results and won't receive blood-request alerts. You can rejoin anytime."
          confirmLabel="Leave program"
          loading={unenrolling}
          destructive
          onConfirm={() => unenroll()}
        />
      </div>
    </AppShell>
  )
}

function Field({ label, children, error }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
