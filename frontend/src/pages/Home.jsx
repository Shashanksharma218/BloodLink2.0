import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '@/components/Navbar'
import Hero from '@/components/Hero'
import AuthModal from '@/components/AuthModal'
import { useAuth } from '@/context/AuthContext'

export default function Home() {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState('signup')
  const { user } = useAuth()
  const navigate = useNavigate()

  const handleCta = (intent) => {
    if (user) {
      navigate('/dashboard')
      return
    }
    setMode(intent)
    setOpen(true)
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Hero
          onBecomeDonor={() => handleCta('signup')}
          onRequestBlood={() => handleCta('signup')}
        />
      </main>
      <AuthModal open={open} onOpenChange={setOpen} initialMode={mode} />
    </div>
  )
}
