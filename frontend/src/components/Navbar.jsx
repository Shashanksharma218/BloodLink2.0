import { useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/context/AuthContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const { account } = useAuth()

  const openAuth = (m) => {
    setAuthMode(m)
    setOpen(true)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2">
          <img src="/blood-drop.png" alt="BloodLink" className="h-8 w-8 object-contain" />
          <span className="text-lg font-bold text-slate-900">BloodLink</span>
        </Link>

        <nav className="flex items-center gap-2">
          {account ? (
            <Button asChild variant="ghost" size="sm">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => openAuth('login')}>
                Login
              </Button>
              <Button size="sm" onClick={() => openAuth('signup')}>
                Sign up
              </Button>
            </>
          )}
        </nav>
      </div>

      <AuthModal open={open} onOpenChange={setOpen} initialMode={authMode} />
    </header>
  )
}
