import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2, Search } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Stepper } from '@/components/shared/Stepper'
import { FileUpload } from '@/components/shared/FileUpload'
import { createRequest } from '@/services/endpoints/seeker'
import { searchHospitals } from '@/services/endpoints/hospital'
import { BLOOD_GROUPS, URGENCY } from '@/lib/enums'
import { addHours, addDays } from 'date-fns'

const STEPS = ['Patient Info', 'Hospital & Timing', 'Contact', 'Proof & Notes']

// Min: now+1h, Max: now+30d
const minDate = () => addHours(new Date(), 1).toISOString().slice(0, 16)
const maxDate = () => addDays(new Date(), 30).toISOString().slice(0, 16)

const step1Schema = z.object({
  patientName: z.string().min(2),
  patientAge: z.coerce.number().int().min(0).max(130),
  patientGender: z.enum(['Male', 'Female', 'Other']),
  bloodGroup: z.enum(BLOOD_GROUPS),
  unitsRequired: z.coerce.number().int().min(1).max(20),
})

const step2Schema = z.object({
  hospitalId: z.string().min(1, 'Hospital ID is required'),
  urgency: z.enum(['CRITICAL', 'HIGH', 'NORMAL']),
  requiredBy: z.string().min(1, 'Required by date is required'),
})

const step3Schema = z.object({
  contactName: z.string().min(2),
  contactPhone: z.string().min(10).max(15),
  contactRelationship: z.string().min(1),
})

export default function SeekerCreateRequest() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [step, setStep] = useState(0)
  const [proofFile, setProofFile] = useState(null)
  const [formData, setFormData] = useState({})
  const [selectedHospital, setSelectedHospital] = useState(null)

  const form1 = useForm({ resolver: zodResolver(step1Schema) })
  const form2 = useForm({ resolver: zodResolver(step2Schema) })
  const form3 = useForm({ resolver: zodResolver(step3Schema) })
  const [notes, setNotes] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: (fd) => createRequest(fd),
    onSuccess: (data) => {
      toast.success('Request submitted! It will be reviewed by the hospital.')
      qc.invalidateQueries({ queryKey: ['seeker', 'requests'] })
      navigate(`/seeker/requests/${data._id ?? data.request?._id}`)
    },
    onError: (err) => toast.error(err.message),
  })

  const next = (data) => {
    setFormData((prev) => ({ ...prev, ...data }))
    setStep((s) => s + 1)
  }

  const submit = async () => {
    const fd = new FormData()
    const all = { ...formData, notes }

    fd.append('patientName', all.patientName)
    fd.append('patientAge', all.patientAge)
    fd.append('patientGender', all.patientGender)
    fd.append('bloodGroup', all.bloodGroup)
    fd.append('unitsRequired', all.unitsRequired)
    fd.append('hospitalId', all.hospitalId)
    fd.append('urgency', all.urgency)
    fd.append('requiredBy', all.requiredBy)
    fd.append('contactName', all.contactName)
    fd.append('contactPhone', all.contactPhone)
    fd.append('contactRelationship', all.contactRelationship)
    if (notes) fd.append('notes', notes)
    if (proofFile) fd.append('proof', proofFile)

    mutate(fd)
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">New Blood Request</h1>
          <p className="mt-1 text-sm text-slate-500">Fill in the details to find matching donors</p>
        </div>

        <Stepper steps={STEPS} currentStep={step} />

        {step === 0 && (
          <StepCard title="Patient Information">
            <form onSubmit={form1.handleSubmit(next)} className="space-y-4">
              <Field label="Patient name" error={form1.formState.errors.patientName?.message}>
                <Input {...form1.register('patientName')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Age" error={form1.formState.errors.patientAge?.message}>
                  <Input {...form1.register('patientAge')} type="number" min={0} max={130} />
                </Field>
                <Field label="Gender" error={form1.formState.errors.patientGender?.message}>
                  <Select {...form1.register('patientGender')}>
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Blood group" error={form1.formState.errors.bloodGroup?.message}>
                  <Select {...form1.register('bloodGroup')}>
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map((g) => <option key={g}>{g}</option>)}
                  </Select>
                </Field>
                <Field label="Units required" error={form1.formState.errors.unitsRequired?.message}>
                  <Input {...form1.register('unitsRequired')} type="number" min={1} max={20} />
                </Field>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit">Next</Button>
              </div>
            </form>
          </StepCard>
        )}

        {step === 1 && (
          <StepCard title="Hospital & Timing">
            <form onSubmit={form2.handleSubmit(next)} className="space-y-4">
              <Field label="Hospital" error={form2.formState.errors.hospitalId?.message}>
                <input type="hidden" {...form2.register('hospitalId')} />
                <HospitalPicker
                  value={selectedHospital}
                  onChange={(h) => {
                    setSelectedHospital(h)
                    form2.setValue('hospitalId', h?._id ?? '', { shouldValidate: true })
                  }}
                />
              </Field>
              <Field label="Urgency" error={form2.formState.errors.urgency?.message}>
                <Select {...form2.register('urgency')}>
                  <option value="">Select</option>
                  <option value={URGENCY.CRITICAL}>Critical</option>
                  <option value={URGENCY.HIGH}>High</option>
                  <option value={URGENCY.NORMAL}>Normal</option>
                </Select>
              </Field>
              <Field label="Required by" error={form2.formState.errors.requiredBy?.message}>
                <Input
                  {...form2.register('requiredBy')}
                  type="datetime-local"
                  min={minDate()}
                  max={maxDate()}
                />
              </Field>
              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
                <Button type="submit">Next</Button>
              </div>
            </form>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard title="Contact Person">
            <form onSubmit={form3.handleSubmit(next)} className="space-y-4">
              <Field label="Contact name" error={form3.formState.errors.contactName?.message}>
                <Input {...form3.register('contactName')} />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone" error={form3.formState.errors.contactPhone?.message}>
                  <Input {...form3.register('contactPhone')} type="tel" />
                </Field>
                <Field label="Relationship" error={form3.formState.errors.contactRelationship?.message}>
                  <Input {...form3.register('contactRelationship')} placeholder="Son, spouse, etc." />
                </Field>
              </div>
              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button type="submit">Next</Button>
              </div>
            </form>
          </StepCard>
        )}

        {step === 3 && (
          <StepCard title="Proof & Notes">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Proof document (optional)</Label>
                <FileUpload value={proofFile} onChange={setProofFile} />
              </div>
              <div className="space-y-1.5">
                <Label>Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional context for the hospital..."
                  rows={3}
                />
              </div>
              <div className="flex justify-between pt-2">
                <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={submit} disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Request
                </Button>
              </div>
            </div>
          </StepCard>
        )}
      </div>
    </AppShell>
  )
}

function StepCard({ title, children }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
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

function HospitalPicker({ value, onChange }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const { data: results = [], isFetching } = useQuery({
    queryKey: ['hospitals', 'search', debouncedQuery],
    queryFn: () => searchHospitals({ search: debouncedQuery }),
    enabled: debouncedQuery.length >= 2,
    staleTime: 30_000,
  })

  if (value) {
    return (
      <div className="flex items-start justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{value.name}</p>
          {value.address && (
            <p className="truncate text-xs text-slate-500">{value.address}</p>
          )}
          <p className="text-xs text-slate-400">Pincode: {value.pincode}</p>
        </div>
        <button
          type="button"
          className="shrink-0 text-xs text-blue-600 hover:underline"
          onClick={() => onChange(null)}
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search by hospital name or pincode"
          className="pl-9"
        />
        {isFetching && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
        )}
      </div>

      {open && debouncedQuery.length >= 2 && (
        <ul className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-slate-200 bg-white shadow-md">
          {results.length === 0 && !isFetching ? (
            <li className="px-3 py-2 text-sm text-slate-400">No hospitals found</li>
          ) : (
            results.map((h) => (
              <li
                key={h._id}
                className="cursor-pointer px-3 py-2 hover:bg-slate-50"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(h)
                  setOpen(false)
                  setQuery('')
                }}
              >
                <p className="text-sm font-medium text-slate-900">{h.name}</p>
                <p className="text-xs text-slate-500">
                  {[h.address, h.pincode].filter(Boolean).join(' · ')}
                </p>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}
