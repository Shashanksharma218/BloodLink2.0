export const ROLE_TINT = {
  donor: {
    primary: '#be123c',
    light: '#fff1f2',
    medium: '#fecdd3',
    text: '#9f1239',
    tailwind: 'brand',
  },
  hospital: {
    primary: '#059669',
    light: '#ecfdf5',
    medium: '#a7f3d0',
    text: '#065f46',
    tailwind: 'emerald',
  },
  seeker: {
    primary: '#d97706',
    light: '#fffbeb',
    medium: '#fde68a',
    text: '#92400e',
    tailwind: 'amber',
  },
}

export const CHART_COLORS = {
  donor: '#be123c',
  hospital: '#059669',
  seeker: '#d97706',
  muted: '#94a3b8',
  emerald: '#10b981',
  amber: '#f59e0b',
}

export const CHART_PALETTE = ['#be123c', '#059669', '#d97706', '#6366f1', '#06b6d4', '#94a3b8']

export const MOTION_FADE_UP = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45 },
}

export function staggerChild(i) {
  return { transition: { delay: i * 0.06, duration: 0.45 } }
}

export const HOVER_LIFT = { whileHover: { y: -4, transition: { duration: 0.2 } } }
