import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Droplet, Loader2, CheckCircle2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { forgotPassword } from '@/services/endpoints/auth'

const schema = z.object({
  accountType: z.enum(['user', 'hospital']),
  email: z.string().email(),
})

export default function ForgotPassword() {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { accountType: 'user', email: '' },
  })

  const onSubmit = async (data) => {
    try {
      await forgotPassword({ email: data.email, role: data.accountType })
      setSubmitted(true)
    } catch {
      // Backend returns success even on unknown email; fall through anyway.
      setSubmitted(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-16">
      <Link to="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Droplet className="h-4 w-4" fill="currentColor" />
        </span>
        <span className="text-lg font-bold text-slate-900">BloodLink</span>
      </Link>

      <Card className="w-full max-w-md">
        <CardContent className="pt-8 pb-8 space-y-5">
          {submitted ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h1 className="text-xl font-bold text-slate-900">Check your inbox</h1>
              <p className="text-sm text-slate-500">
                If an account exists for that email, we've sent a password reset link. The link expires in 1 hour.
              </p>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link to="/">Back home</Link>
              </Button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Forgot your password?</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Enter your account email and we'll send you a reset link.
                </p>
              </div>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Account type</Label>
                  <Select {...form.register('accountType')}>
                    <option value="user">Donor / User</option>
                    <option value="hospital">Hospital</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input {...form.register('email')} type="email" autoComplete="email" />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send reset link
                </Button>
              </form>
              <p className="text-center text-sm text-slate-500">
                <Link to="/" className="font-medium text-brand-600 hover:underline">Back to home</Link>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
