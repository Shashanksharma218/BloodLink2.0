import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Command } from 'cmdk'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, Search, HeartPulse, Award, User, Building2,
  ClipboardList, CheckSquare, Droplets, PlusCircle, List, Users,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const DONOR_ITEMS = [
  { label: 'Overview', to: '/donor', icon: Activity },
  { label: 'Matched Requests', to: '/donor/feed', icon: Search },
  { label: 'My Pledges', to: '/donor/pledges', icon: HeartPulse },
  { label: 'Donations', to: '/donor/donations', icon: Activity },
  { label: 'Certificates', to: '/donor/certificates', icon: Award },
  { label: 'Blood Inventory', to: '/inventory', icon: Droplets },
  { label: 'Profile', to: '/donor/profile', icon: User },
]

const HOSPITAL_ITEMS = [
  { label: 'Overview', to: '/hospital', icon: Activity },
  { label: 'Verification Queue', to: '/hospital/queue', icon: ClipboardList },
  { label: 'Active Requests', to: '/hospital/active', icon: CheckSquare },
  { label: 'Donations', to: '/hospital/donations', icon: Activity },
  { label: 'Record Donation', to: '/hospital/donations/new', icon: PlusCircle },
  { label: 'Donors', to: '/hospital/donors', icon: Users },
  { label: 'Blood Inventory', to: '/inventory', icon: Droplets },
  { label: 'Profile', to: '/hospital/profile', icon: Building2 },
]

const SEEKER_ITEMS = [
  { label: 'Overview', to: '/seeker', icon: Activity },
  { label: 'My Requests', to: '/seeker/requests', icon: List },
  { label: 'New Request', to: '/seeker/requests/new', icon: PlusCircle },
  { label: 'Blood Inventory', to: '/inventory', icon: Droplets },
  { label: 'Profile', to: '/donor/profile', icon: User },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { isHospital, mode } = useAuth()

  const items = isHospital ? HOSPITAL_ITEMS : mode === 'seeker' ? SEEKER_ITEMS : DONOR_ITEMS

  const toggle = useCallback(() => setOpen((o) => !o), [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        toggle()
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle])

  const run = (to) => {
    navigate(to)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={toggle}
        className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-400 hover:border-slate-300 hover:bg-white transition-colors"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Quick nav</span>
        <kbd className="ml-1 rounded bg-slate-200 px-1 py-0.5 text-[10px] text-slate-500">⌘K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="fixed left-1/2 top-[15%] z-50 w-full max-w-md -translate-x-1/2"
            >
              <Command className="rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
                <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
                  <Search className="h-4 w-4 text-slate-400 shrink-0" />
                  <Command.Input
                    placeholder="Go to..."
                    className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                    autoFocus
                  />
                </div>
                <Command.List className="max-h-64 overflow-y-auto p-2">
                  <Command.Empty className="py-6 text-center text-sm text-slate-400">
                    No pages found
                  </Command.Empty>
                  <Command.Group heading={<span className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-2">Navigate</span>}>
                    {items.map((item) => (
                      <Command.Item
                        key={item.to}
                        value={item.label}
                        onSelect={() => run(item.to)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-brand-50 hover:text-brand-700 aria-selected:bg-brand-50 aria-selected:text-brand-700 transition-colors"
                      >
                        <item.icon className="h-4 w-4 shrink-0 text-slate-400" />
                        {item.label}
                      </Command.Item>
                    ))}
                  </Command.Group>
                </Command.List>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
