import { motion } from 'framer-motion'
import Mascot from '@/components/home/Mascot'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

export function EmptyMascot({ title, description, action, actionTo, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'h-20 w-auto' : size === 'lg' ? 'h-40 w-auto' : 'h-28 w-auto'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center py-8 text-center"
    >
      <Mascot className={sizeClass} />
      {title && (
        <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
      )}
      {description && (
        <p className="mt-1 max-w-xs text-xs text-slate-400 leading-relaxed">{description}</p>
      )}
      {action && actionTo && (
        <Button asChild size="sm" className="mt-4">
          <Link to={actionTo}>{action}</Link>
        </Button>
      )}
    </motion.div>
  )
}
