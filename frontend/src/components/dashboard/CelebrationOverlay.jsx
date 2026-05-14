import { motion, AnimatePresence } from 'framer-motion'
import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import Mascot from '@/components/home/Mascot'

const CelebrationCtx = createContext(null)

const CONFETTI_PIECES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.6,
  duration: 1.2 + Math.random() * 0.8,
  color: ['#be123c', '#fecdd3', '#059669', '#fbbf24', '#818cf8'][i % 5],
  rotation: Math.random() * 360,
  size: 6 + Math.random() * 8,
}))

export function CelebrationProvider({ children }) {
  const [message, setMessage] = useState(null)

  const celebrate = useCallback((msg = '🎉 Amazing!') => {
    setMessage(msg)
  }, [])

  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => setMessage(null), 3200)
    return () => clearTimeout(t)
  }, [message])

  return (
    <CelebrationCtx.Provider value={{ celebrate }}>
      {children}
      <AnimatePresence>
        {message && <CelebrationUI message={message} />}
      </AnimatePresence>
    </CelebrationCtx.Provider>
  )
}

export function useCelebration() {
  const ctx = useContext(CelebrationCtx)
  if (!ctx) throw new Error('useCelebration must be used within CelebrationProvider')
  return ctx
}

function CelebrationUI({ message }) {
  const prefersReduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center"
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm" />

      {/* Confetti */}
      {!prefersReduced && CONFETTI_PIECES.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, x: `${p.x}vw`, y: '-10vh', rotate: 0 }}
          animate={{ opacity: 0, y: '110vh', rotate: p.rotation }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{ width: p.size, height: p.size, background: p.color, borderRadius: 2 }}
        />
      ))}

      {/* Card */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        className="relative z-10 flex flex-col items-center gap-3 rounded-3xl border border-brand-100 bg-white px-10 py-8 shadow-2xl"
      >
        <Mascot className="h-24 w-auto" />
        <p className="text-xl font-bold text-slate-900">{message}</p>
      </motion.div>
    </motion.div>
  )
}
