import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePassword } from '@/services/endpoints/auth'

const schema = z.object({
  current: z.string().min(1, 'Current password is required'),
  next: z.string().min(8, 'New password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.next === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

export default function ChangePassword() {
  const form = useForm({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => changePassword({ current: data.current, next: data.next }),
    onSuccess: () => {
      toast.success('Password changed successfully.')
      form.reset()
    },
    onError: (err) => {
      if (err.status === 401) {
        form.setError('current', { message: 'Incorrect current password.' })
      } else {
        toast.error(err.message)
      }
    },
  })

  return (
    <AppShell>
      <div className="max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Change Password</h1>

        <form onSubmit={form.handleSubmit((d) => mutate(d))}>
          <Card>
            <CardHeader><CardTitle>Update Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Field label="Current password" error={form.formState.errors.current?.message}>
                <Input {...form.register('current')} type="password" />
              </Field>
              <Field label="New password" error={form.formState.errors.next?.message}>
                <Input {...form.register('next')} type="password" />
              </Field>
              <Field label="Confirm new password" error={form.formState.errors.confirm?.message}>
                <Input {...form.register('confirm')} type="password" />
              </Field>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Change password
              </Button>
            </CardFooter>
          </Card>
        </form>
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
