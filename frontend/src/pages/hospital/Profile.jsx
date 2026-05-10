import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'
import { getHospitalProfile, updateHospitalProfile } from '@/services/endpoints/hospital'

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15),
  address: z.string().min(5),
})

const STATE_CONFIG = {
  VERIFIED: { variant: 'success', label: 'Verified' },
  UNVERIFIED: { variant: 'warning', label: 'Pending Verification' },
  SUSPENDED: { variant: 'danger', label: 'Suspended' },
}

export default function HospitalProfile() {
  const qc = useQueryClient()

  const { data: profile, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['hospital', 'profile'],
    queryFn: getHospitalProfile,
  })

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', phone: '', address: '' },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
      })
    }
  }, [profile])

  const { mutate, isPending } = useMutation({
    mutationFn: updateHospitalProfile,
    onSuccess: () => {
      toast.success('Profile updated.')
      qc.invalidateQueries({ queryKey: ['hospital', 'profile'] })
    },
    onError: (err) => toast.error(err.message),
  })

  if (isLoading) return <AppShell><LoadingState /></AppShell>
  if (isError) return <AppShell><ErrorState message={error.message} onRetry={refetch} /></AppShell>

  const stateCfg = STATE_CONFIG[profile?.state] ?? STATE_CONFIG.UNVERIFIED

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Hospital Profile</h1>

        {/* Read-only info */}
        <Card>
          <CardHeader><CardTitle>Account Info</CardTitle></CardHeader>
          <CardContent>
            <dl className="divide-y divide-slate-100 text-sm">
              <Row label="Pincode" value={profile?.pincode} />
              <Row label="License number" value={profile?.licenseNumber} />
              <Row
                label="Status"
                value={<Badge variant={stateCfg.variant}>{stateCfg.label}</Badge>}
              />
              {profile?.verifiedAt && (
                <Row label="Verified on" value={format(new Date(profile.verifiedAt), 'dd MMM yyyy')} />
              )}
            </dl>
          </CardContent>
        </Card>

        {/* Editable form */}
        <form onSubmit={form.handleSubmit((d) => mutate(d))}>
          <Card>
            <CardHeader><CardTitle>Edit Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Hospital name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <Field label="Phone" error={form.formState.errors.phone?.message}>
                <Input {...form.register('phone')} type="tel" />
              </Field>
              <Field label="Address" error={form.formState.errors.address?.message}>
                <Input {...form.register('address')} />
              </Field>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save changes
              </Button>
            </CardFooter>
          </Card>
        </form>
      </div>
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

function Field({ label, children, error }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
