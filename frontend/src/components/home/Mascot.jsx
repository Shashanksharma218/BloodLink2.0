import { motion } from 'framer-motion'
import { useMemo } from 'react'

export default function Mascot({ className = 'h-64 w-auto' }) {
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )

  const bobVariants = prefersReducedMotion
    ? {}
    : {
        animate: { y: [0, -12, 0] },
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
      }

  const blinkVariants = prefersReducedMotion
    ? {}
    : {
        animate: { scaleY: [1, 1, 0.1, 1, 1] },
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut', times: [0, 0.45, 0.5, 0.55, 1] },
      }

  return (
    <motion.svg
      className={className}
      viewBox="0 0 200 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...bobVariants}
    >
      {/* Drop body */}
      <path
        d="M100 18 C132 52, 164 96, 164 136 A64 64 0 0 1 36 136 C36 96 68 52 100 18Z"
        fill="#be123c"
      />
      {/* Inner sheen */}
      <ellipse cx="78" cy="76" rx="9" ry="13" fill="white" fillOpacity="0.25" transform="rotate(-18 78 76)" />

      {/* Left eye white */}
      <ellipse cx="82" cy="118" rx="10" ry="10" fill="white" />
      {/* Right eye white */}
      <ellipse cx="118" cy="118" rx="10" ry="10" fill="white" />

      {/* Pupils with blink */}
      <motion.g style={{ transformOrigin: '82px 119px' }} {...blinkVariants}>
        <ellipse cx="83" cy="119" rx="5" ry="5" fill="#1a0404" />
        <ellipse cx="85" cy="117" rx="1.5" ry="1.5" fill="white" />
      </motion.g>
      <motion.g style={{ transformOrigin: '118px 119px' }} {...blinkVariants}>
        <ellipse cx="119" cy="119" rx="5" ry="5" fill="#1a0404" />
        <ellipse cx="121" cy="117" rx="1.5" ry="1.5" fill="white" />
      </motion.g>

      {/* Smile */}
      <path
        d="M84 144 Q100 158 116 144"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rosy cheeks */}
      <ellipse cx="72" cy="136" rx="8" ry="5" fill="#f43f5e" fillOpacity="0.35" />
      <ellipse cx="128" cy="136" rx="8" ry="5" fill="#f43f5e" fillOpacity="0.35" />
    </motion.svg>
  )
}
