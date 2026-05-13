import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { useAuth } from '@/context/AuthContext'
import { BLOOD_GROUPS } from '@/lib/enums'

const loginSchema = z.object({
  accountType: z.enum(['user', 'hospital']),
  email: z.string().email(),
  password: z.string().min(6),
})

const userRegisterSchema = z.object({
  accountType: z.literal('user'),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  confirm: z.string(),
  phone: z.string().min(10).max(15),
  pincode: z.string().length(6),
  bloodGroup: z.enum(BLOOD_GROUPS),
  donorEnrolled: z.boolean().default(true),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

const hospitalRegisterSchema = z.object({
  accountType: z.literal('hospital'),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  confirm: z.string(),
  phone: z.string().min(10).max(15),
  pincode: z.string().length(6),
  address: z.string().min(5),
  licenseNumber: z.string().min(3),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] })

export default function AuthModal({ open, onOpenChange, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [showPw, setShowPw] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [accountType, setAccountType] = useState('user')

  const { login: doLogin, register: doRegister } = useAuth()
  const navigate = useNavigate()

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { accountType: 'user', email: '', password: '' },
  })

  const registerForm = useForm({
    resolver: zodResolver(accountType === 'hospital' ? hospitalRegisterSchema : userRegisterSchema),
    defaultValues: { accountType: 'user', name: '', email: '', password: '', confirm: '', phone: '', pincode: '', bloodGroup: 'O+', donorEnrolled: true, address: '', licenseNumber: '' },
  })

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setShowPw(false)
      setShowConfirm(false)
      loginForm.reset()
      registerForm.reset()
    }
  }, [open, initialMode])

  const handleLogin = async (data) => {
    const { accountType, ...rest } = data
    try {
      await doLogin({ ...rest, role: accountType })
      onOpenChange(false)
      navigate('/dashboard')
    } catch (err) {
      loginForm.setError('password', { message: err.message || 'Invalid credentials' })
    }
  }

  const handleRegister = async (data) => {
    const { confirm, accountType, ...rest } = data
    const payload = { ...rest, role: accountType }
    try {
      await doRegister(payload)
      onOpenChange(false)
      navigate('/dashboard')
    } catch (err) {
      registerForm.setError('root', { message: err.message || 'Registration failed' })
    }
  }

  const onTypeChange = (val) => {
    setAccountType(val)
    registerForm.setValue('accountType', val)
    loginForm.setValue('accountType', val)
  }

  const isLogin = mode === 'login'
  const isHospital = accountType === 'hospital'

  const isDirty = isLogin
    ? loginForm.formState.isDirty
    : registerForm.formState.isDirty

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => { if (isDirty) e.preventDefault() }}
      >
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Welcome back' : 'Create your account'}</DialogTitle>
          <DialogDescription>
            {isLogin ? 'Log in to manage donations and requests.' : 'Join BloodLink as a donor or hospital.'}
          </DialogDescription>
        </DialogHeader>

        {/* Account type switcher */}
        <div className="flex gap-2 mb-1">
          {(['user', 'hospital'] ).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTypeChange(t)}
              className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                accountType === t
                  ? 'border-brand-600 bg-brand-50 text-brand-700'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t === 'user' ? 'Donor / User' : 'Hospital'}
            </button>
          ))}
        </div>

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-3">
            <Field label="Email" error={loginForm.formState.errors.email?.message}>
              <Input {...loginForm.register('email')} type="email" autoComplete="email" />
            </Field>
            <Field label="Password" error={loginForm.formState.errors.password?.message}>
              <div className="relative">
                <Input {...loginForm.register('password')} type={showPw ? 'text' : 'password'} className="pr-9" autoComplete="current-password" />
                <PwToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />
              </div>
            </Field>
            <Button type="submit" className="w-full" disabled={loginForm.formState.isSubmitting}>
              {loginForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Log in
            </Button>
            <div className="text-right">
              <Link
                to="/forgot-password"
                onClick={() => onOpenChange(false)}
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-3">
            {registerForm.formState.errors.root && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {registerForm.formState.errors.root.message}
              </div>
            )}

            <Field label={isHospital ? 'Hospital name' : 'Full name'} error={registerForm.formState.errors.name?.message}>
              <Input {...registerForm.register('name')} />
            </Field>
            <Field label="Email" error={registerForm.formState.errors.email?.message}>
              <Input {...registerForm.register('email')} type="email" autoComplete="email" />
            </Field>
            <Field label="Password" error={registerForm.formState.errors.password?.message}>
              <div className="relative">
                <Input {...registerForm.register('password')} type={showPw ? 'text' : 'password'} className="pr-9" autoComplete="new-password" />
                <PwToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />
              </div>
            </Field>
            <Field label="Confirm password" error={registerForm.formState.errors.confirm?.message}>
              <div className="relative">
                <Input {...registerForm.register('confirm')} type={showConfirm ? 'text' : 'password'} className="pr-9" />
                <PwToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" error={registerForm.formState.errors.phone?.message}>
                <Input {...registerForm.register('phone')} type="tel" placeholder="10-digit number" />
              </Field>
              <Field label="Pincode" error={registerForm.formState.errors.pincode?.message}>
                <Input {...registerForm.register('pincode')} maxLength={6} placeholder="6-digit code" />
              </Field>
            </div>

            {isHospital ? (
              <>
                <Field label="Address" error={registerForm.formState.errors.address?.message}>
                  <Input {...registerForm.register('address')} />
                </Field>
                <Field label="License number" error={registerForm.formState.errors.licenseNumber?.message}>
                  <Input {...registerForm.register('licenseNumber')} />
                </Field>
              </>
            ) : (
              <>
                <Field label="Blood group" error={registerForm.formState.errors.bloodGroup?.message}>
                  <Select {...registerForm.register('bloodGroup')}>
                    {BLOOD_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </Select>
                </Field>
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    {...registerForm.register('donorEnrolled')}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-brand-600"
                  />
                  <span className="text-sm text-slate-700">
                    Register as a blood donor
                    <span className="block text-xs text-slate-400">You can change this anytime.</span>
                  </span>
                </label>
              </>
            )}

            <Button type="submit" className="w-full" disabled={registerForm.formState.isSubmitting}>
              {registerForm.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-medium text-brand-600 hover:underline"
            onClick={() => setMode(isLogin ? 'signup' : 'login')}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
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

function PwToggle({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-2 flex items-center text-slate-400 hover:text-slate-600"
      tabIndex={-1}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}
