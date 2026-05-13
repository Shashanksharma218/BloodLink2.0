import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

const CHECKS = [
  { text: 'Aged 18–65 years' },
  { text: 'Weight ≥ 50 kg' },
  { text: 'Hemoglobin ≥ 12.5 g/dL' },
  { text: '90+ days since last donation' },
  { text: 'Feeling healthy today' },
]

function BodySilhouette() {
  return (
    <svg
      viewBox="0 0 140 260"
      className="h-full w-auto"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Head */}
      <ellipse cx="70" cy="28" rx="22" ry="24" fill="#fecdd3" />
      {/* Neck */}
      <rect x="62" y="50" width="16" height="12" rx="4" fill="#fecdd3" />
      {/* Body */}
      <path d="M38 62 Q28 68 26 90 L22 160 Q22 170 32 170 L38 170 L38 240 Q38 248 46 248 L60 248 Q68 248 68 240 L68 170 L72 170 L72 240 Q72 248 80 248 L94 248 Q102 248 102 240 L102 170 L108 170 Q118 170 118 160 L114 90 Q112 68 102 62 Z" fill="#fda4af" />
      {/* Left arm */}
      <path d="M38 68 Q18 80 14 115 Q12 128 18 132 Q22 128 24 115 Q28 98 42 88 Z" fill="#fecdd3" />
      {/* Right arm */}
      <path d="M102 68 Q122 80 126 115 Q128 128 122 132 Q118 128 116 115 Q112 98 98 88 Z" fill="#fecdd3" />

      {/* Pulsing heart */}
      <motion.g
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '70px 108px' }}
      >
        <path
          d="M70 120 C70 120, 56 110, 56 100 C56 94, 61 90, 66 91 C68 91.5, 70 93, 70 93 C70 93, 72 91.5, 74 91 C79 90, 84 94, 84 100 C84 110, 70 120, 70 120Z"
          fill="#be123c"
          fillOpacity="0.9"
        />
      </motion.g>

      {/* Pulse line */}
      <motion.path
        d="M30 145 L50 145 L56 135 L62 158 L68 128 L74 155 L80 145 L110 145"
        stroke="#be123c"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        strokeDasharray="120"
        animate={{ strokeDashoffset: [120, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 0.4 }}
      />
    </svg>
  )
}

export default function EligibilityChecklist() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })

  return (
    <section className="bg-slate-50 py-20">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
            Are you eligible to donate?
          </h2>
          <p className="mb-12 text-center text-sm text-slate-500">
            Most healthy adults can donate blood. Here's a quick checklist.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:items-center">
          {/* Silhouette */}
          <div className="flex justify-center">
            <div className="h-56 sm:h-64">
              <BodySilhouette />
            </div>
          </div>

          {/* Checklist */}
          <div ref={ref} className="space-y-4">
            {CHECKS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 24 }}
                animate={isInView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.45, delay: i * 0.12 }}
                className="flex items-center gap-4 rounded-xl border border-emerald-100 bg-white p-4 shadow-sm"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : {}}
                  transition={{ type: 'spring', stiffness: 500, damping: 18, delay: i * 0.12 + 0.2 }}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
                <span className="text-sm font-medium text-slate-700">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
