import { Badge } from '@/components/ui/badge'

const CONFIG = {
  ACCEPTED: { variant: 'info', label: 'Accepted' },
  FULFILLED: { variant: 'success', label: 'Fulfilled' },
  CANCELLED: { variant: 'default', label: 'Cancelled' },
  NO_SHOW: { variant: 'danger', label: 'No Show' },
  VOID: { variant: 'default', label: 'Void' },
}

export function PledgeStatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { variant: 'default', label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
