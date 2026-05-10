import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Droplet, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { resetPassword } from '@/services/endpoints/auth'

const schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')
  const role = params.get('role')
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)
  const [done, setDone] = useState(false)

  const form = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    if (!token || !role) {
      toast.error('Invalid reset link')
      return
    }
    try {
      await resetPassword({ token, role, password: data.password })
      setDone(true)
      setTimeout(() => navigate('/'), 2500)
    } catch (err) {
      toast.error(err.message || 'Failed to reset password')
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
          {done ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
              <h1 className="text-xl font-bold text-slate-900">Password reset</h1>
              <p className="text-sm text-slate-500">
                Your password has been updated. Redirecting you home...
              </p>
            </div>
          ) : (
            <>
              <div>
                <h1 className="text-xl font-bold text-slate-900">Choose a new password</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Enter and confirm your new BloodLink password.
                </p>
              </div>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                <div className="space-y-1.5">
                  <Label>New password</Label>
                  <div className="relative">
                    <Input
                      {...form.register('password')}
                      type={showPw ? 'text' : 'password'}
                      autoComplete="new-password"
                      className="pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {form.formState.errors.password && (
                    <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm new password</Label>
                  <Input {...form.register('confirm')} type={showPw ? 'text' : 'password'} />
                  {form.formState.errors.confirm && (
                    <p className="text-xs text-red-600">{form.formState.errors.confirm.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Reset password
                </Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
