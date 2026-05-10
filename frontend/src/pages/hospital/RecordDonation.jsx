import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { recordDonation } from '@/services/endpoints/hospital'
import { DONATION_TYPE } from '@/lib/enums'

const schema = z.object({
  pledgeId: z.string().optional(),
  donorId: z.string().optional(),
  donationType: z.enum(['WHOLE_BLOOD', 'PLASMA', 'PLATELETS']),
  units: z.coerce.number().int().min(1).max(10),
  donatedAt: z.string().optional(),
  notes: z.string().optional(),
}).refine((d) => d.pledgeId || d.donorId, {
  message: 'Either pledge or donor ID is required',
  path: ['pledgeId'],
})

export default function HospitalRecordDonation() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const pledgeIdFromUrl = params.get('pledgeId')

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

  useEffect(() => {
    if (pledgeIdFromUrl) form.setValue('pledgeId', pledgeIdFromUrl)
  }, [pledgeIdFromUrl])

  const { mutate, isPending } = useMutation({
    mutationFn: recordDonation,
    onSuccess: () => {
      toast.success('Donation recorded. Pending verification.')
      qc.invalidateQueries({ queryKey: ['hospital', 'donations'] })
      navigate('/hospital/donations')
    },
    onError: (err) => toast.error(err.message),
  })

  const hasPledge = !!form.watch('pledgeId')

  return (
    <AppShell>
      <div className="max-w-lg space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Record Donation</h1>

        <form onSubmit={form.handleSubmit((d) => mutate({
          ...d,
          pledgeId: d.pledgeId || undefined,
          donorId: d.donorId || undefined,
          donatedAt: d.donatedAt || undefined,
          notes: d.notes || undefined,
        }))}>
          <Card>
            <CardHeader><CardTitle>Donation Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Pledge ID" error={form.formState.errors.pledgeId?.message}
                hint="From an accepted pledge. Leave blank to record walk-in.">
                <Input {...form.register('pledgeId')} placeholder="Leave blank for walk-in" />
              </Field>

              {!hasPledge && (
                <Field label="Donor ID (walk-in)" error={form.formState.errors.donorId?.message}
                  hint="The donor's user ID from their BloodLink profile.">
                  <Input {...form.register('donorId')} />
                </Field>
              )}

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
                <Textarea {...form.register('notes')} rows={2} placeholder="Any observations..." />
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
        </form>
      </div>
    </AppShell>
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
