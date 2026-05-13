import { motion } from 'framer-motion'

function DropSvg({ size = 32, color = '#be123c', opacity = 0.7 }) {
  return (
    <svg width={size} height={size * 1.2} viewBox="0 0 40 48" fill="none" aria-hidden="true">
      <path
        d="M20 2 C28 14, 36 24, 36 32 A16 16 0 0 1 4 32 C4 24, 12 14, 20 2Z"
        fill={color}
        fillOpacity={opacity}
      />
    </svg>
  )
}

function PlusSvg({ size = 24, color = '#be123c', opacity = 0.5 }) {
  const t = size / 3
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="10" y="2" width="4" height="20" rx="2" fill={color} fillOpacity={opacity} />
      <rect x="2" y="10" width="20" height="4" rx="2" fill={color} fillOpacity={opacity} />
    </svg>
  )
}

function HeartSvg({ size = 28, color = '#be123c', opacity = 0.6 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={color}
        fillOpacity={opacity}
      />
    </svg>
  )
}

function SparkSvg({ size = 20, color = '#be123c', opacity = 0.4 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2L13.5 9H21L15 13.5L17 21L12 16.5L7 21L9 13.5L3 9H10.5L12 2Z"
        fill={color} fillOpacity={opacity} />
    </svg>
  )
}

const SHAPES = [
  { Component: DropSvg,  props: { size: 28, color: '#be123c', opacity: 0.7 }, x: '8%',  y: '12%', delay: 0,   duration: 7 },
  { Component: PlusSvg, props: { size: 22, color: '#9f1239', opacity: 0.5 }, x: '80%', y: '8%',  delay: 1.2, duration: 9 },
  { Component: HeartSvg, props: { size: 30, color: '#e11d48', opacity: 0.55 }, x: '90%', y: '45%', delay: 0.6, duration: 8 },
  { Component: DropSvg,  props: { size: 18, color: '#be123c', opacity: 0.5 }, x: '5%',  y: '55%', delay: 2,   duration: 10 },
  { Component: SparkSvg, props: { size: 22, color: '#9f1239', opacity: 0.45 }, x: '70%', y: '70%', delay: 1.8, duration: 6 },
  { Component: PlusSvg, props: { size: 16, color: '#e11d48', opacity: 0.4 }, x: '20%', y: '80%', delay: 0.4, duration: 11 },
]

export default function FloatingDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {SHAPES.map(({ Component, props, x, y, delay, duration }, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: x, top: y }}
          animate={{ y: [0, -14, 0], rotate: [0, 8, -8, 0] }}
          transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Component {...props} />
        </motion.div>
      ))}
    </div>
  )
}
