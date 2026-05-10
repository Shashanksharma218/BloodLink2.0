import { Badge } from '@/components/ui/badge'

const CONFIG = {
  RECORDED: { variant: 'warning', label: 'Recorded' },
  VERIFIED: { variant: 'success', label: 'Verified' },
  REJECTED: { variant: 'danger', label: 'Rejected' },
}

export function DonationStateBadge({ state }) {
  const cfg = CONFIG[state] ?? { variant: 'default', label: state }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
