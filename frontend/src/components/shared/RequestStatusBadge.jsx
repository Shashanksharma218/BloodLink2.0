import { Badge } from '@/components/ui/badge'

const CONFIG = {
  PENDING_VERIFICATION: { variant: 'warning', label: 'Pending Verification' },
  VERIFIED: { variant: 'success', label: 'Verified' },
  PARTIALLY_FULFILLED: { variant: 'info', label: 'Partially Fulfilled' },
  FULFILLED: { variant: 'success', label: 'Fulfilled' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
  EXPIRED: { variant: 'default', label: 'Expired' },
  CANCELLED: { variant: 'default', label: 'Cancelled' },
}

export function RequestStatusBadge({ status }) {
  const cfg = CONFIG[status] ?? { variant: 'default', label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
