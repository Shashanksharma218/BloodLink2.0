import { Badge } from '@/components/ui/badge'

const URGENCY_CONFIG = {
  CRITICAL: { variant: 'danger', label: 'Critical' },
  HIGH: { variant: 'warning', label: 'High' },
  NORMAL: { variant: 'info', label: 'Normal' },
}

export function UrgencyBadge({ urgency }) {
  const cfg = URGENCY_CONFIG[urgency] ?? { variant: 'default', label: urgency }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
