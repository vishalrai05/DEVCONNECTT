import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

export default function AuthCard({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'glass rounded-3xl p-6 sm:p-8 shadow-xl shadow-black/10',
        className,
      )}
    >
      {children}
    </motion.div>
  )
}
