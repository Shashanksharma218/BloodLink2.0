import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
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

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

const emptySignup = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  bloodGroup: 'O+',
  pincode: '',
  phone: '',
}

const emptyLogin = { email: '', password: '', role: 'user' }

export default function AuthModal({ open, onOpenChange, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode)
  const [signup, setSignup] = useState(emptySignup)
  const [login, setLogin] = useState(emptyLogin)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login: doLogin, register: doRegister } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (open) {
      setMode(initialMode)
      setError('')
    }
  }, [open, initialMode])

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = { ...signup }
      if (payload.role === 'hospital') delete payload.bloodGroup
      await doRegister(payload)
      onOpenChange(false)
      setSignup(emptySignup)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await doLogin(login)
      onOpenChange(false)
      setLogin(emptyLogin)
      navigate('/dashboard')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const isLogin = mode === 'login'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isLogin ? 'Welcome back' : 'Create your account'}</DialogTitle>
          <DialogDescription>
            {isLogin
              ? 'Log in to manage donations and requests.'
              : 'Join BloodLink as a donor or hospital.'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="login-role">I am a</Label>
              <Select
                id="login-role"
                value={login.role}
                onChange={(e) => setLogin({ ...login, role: e.target.value })}
              >
                <option value="user">Donor / User</option>
                <option value="hospital">Hospital</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                required
                value={login.email}
                onChange={(e) => setLogin({ ...login, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                required
                minLength={6}
                value={login.password}
                onChange={(e) => setLogin({ ...login, password: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Log in
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="signup-role">I am a</Label>
              <Select
                id="signup-role"
                value={signup.role}
                onChange={(e) => setSignup({ ...signup, role: e.target.value })}
              >
                <option value="user">Donor / User</option>
                <option value="hospital">Hospital</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-name">
                {signup.role === 'hospital' ? 'Hospital name' : 'Full name'}
              </Label>
              <Input
                id="signup-name"
                required
                value={signup.name}
                onChange={(e) => setSignup({ ...signup, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                required
                value={signup.email}
                onChange={(e) => setSignup({ ...signup, email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                required
                minLength={6}
                value={signup.password}
                onChange={(e) => setSignup({ ...signup, password: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-pincode">Pincode</Label>
                <Input
                  id="signup-pincode"
                  required
                  value={signup.pincode}
                  onChange={(e) => setSignup({ ...signup, pincode: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-phone">Phone</Label>
                <Input
                  id="signup-phone"
                  type="tel"
                  value={signup.phone}
                  onChange={(e) => setSignup({ ...signup, phone: e.target.value })}
                />
              </div>
            </div>
            {signup.role === 'user' && (
              <div className="space-y-1.5">
                <Label htmlFor="signup-bg">Blood group</Label>
                <Select
                  id="signup-bg"
                  value={signup.bloodGroup}
                  onChange={(e) => setSignup({ ...signup, bloodGroup: e.target.value })}
                >
                  {BLOOD_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Create account
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-slate-500">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="font-medium text-brand-600 hover:underline"
            onClick={() => {
              setError('')
              setMode(isLogin ? 'signup' : 'login')
            }}
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>
      </DialogContent>
    </Dialog>
  )
}
