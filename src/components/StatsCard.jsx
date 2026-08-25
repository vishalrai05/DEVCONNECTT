import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

export default function StatsCard({ label, value, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.03 }}
      className={cn(
        'glass rounded-2xl px-5 py-4 shadow-lg shadow-black/20',
        className,
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-gradient sm:text-3xl">{value}</p>
    </motion.div>
  )
}
