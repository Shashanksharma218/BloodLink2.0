import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BloodGroupBadge } from '@/components/shared/BloodGroupBadge'

const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

const COMPATIBILITY = {
  'A+':  { giveTo: ['A+', 'AB+'],                        receiveFrom: ['A+', 'A-', 'O+', 'O-'] },
  'A-':  { giveTo: ['A+', 'A-', 'AB+', 'AB-'],          receiveFrom: ['A-', 'O-'] },
  'B+':  { giveTo: ['B+', 'AB+'],                        receiveFrom: ['B+', 'B-', 'O+', 'O-'] },
  'B-':  { giveTo: ['B+', 'B-', 'AB+', 'AB-'],          receiveFrom: ['B-', 'O-'] },
  'AB+': { giveTo: ['AB+'],                              receiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'AB-': { giveTo: ['AB+', 'AB-'],                       receiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
  'O+':  { giveTo: ['A+', 'B+', 'O+', 'AB+'],           receiveFrom: ['O+', 'O-'] },
  'O-':  { giveTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], receiveFrom: ['O-'] },
}

export default function CompatibilityTool() {
  const [selected, setSelected] = useState(null)
  const compat = selected ? COMPATIBILITY[selected] : null

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-5xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="mb-2 text-center text-2xl font-bold text-slate-900">
            Blood Compatibility Chart
          </h2>
          <p className="mb-10 text-center text-sm text-slate-500">
            Select your blood group to see who you can give to and receive from.
          </p>
        </motion.div>

        {/* Group selector */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {GROUPS.map((g) => (
            <motion.button
              key={g}
              onClick={() => setSelected(g === selected ? null : g)}
              whileHover={{ scale: 1.07 }}
              whileTap={{ scale: 0.95 }}
              className={`rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition-all duration-200 ${
                selected === g
                  ? 'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-brand-50'
              }`}
            >
              {g}
            </motion.button>
          ))}
        </div>

        {/* Results */}
        <AnimatePresence mode="wait">
          {compat ? (
            <motion.div
              key={selected}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="grid grid-cols-1 gap-6 sm:grid-cols-2"
            >
              <CompatPanel
                title="You can donate to"
                groups={compat.giveTo}
                accent="emerald"
                icon={
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-emerald-600" aria-hidden="true">
                    <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"/>
                  </svg>
                }
              />
              <CompatPanel
                title="You can receive from"
                groups={compat.receiveFrom}
                accent="brand"
                icon={
                  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-brand-600" aria-hidden="true">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                }
              />
            </motion.div>
          ) : (
            <motion.p
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center text-sm text-slate-400"
            >
              Select a blood group above to see compatibility.
            </motion.p>
          )}
        </AnimatePresence>

        {selected === 'O-' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-xs font-medium text-brand-600"
          >
            O- is the universal donor — can give to all blood groups.
          </motion.p>
        )}
        {selected === 'AB+' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center text-xs font-medium text-emerald-600"
          >
            AB+ is the universal recipient — can receive from all blood groups.
          </motion.p>
        )}
      </div>
    </section>
  )
}

function CompatPanel({ title, groups, accent, icon }) {
  const borderColor = accent === 'emerald' ? 'border-emerald-100' : 'border-brand-100'
  const bgColor = accent === 'emerald' ? 'bg-emerald-50' : 'bg-brand-50'
  const headingColor = accent === 'emerald' ? 'text-emerald-800' : 'text-brand-800'

  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} p-6`}>
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className={`text-sm font-semibold ${headingColor}`}>{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {groups.map((g) => (
          <motion.div
            key={g}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            <BloodGroupBadge group={g} />
          </motion.div>
        ))}
      </div>
    </div>
  )
}
