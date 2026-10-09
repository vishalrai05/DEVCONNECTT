import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { cn } from '../utils/cn'

const variants = {
  primary:
    'btn-gradient text-white shadow-lg shadow-emerald-900/25 hover:shadow-emerald-700/30',
  secondary:
    'bg-transparent border border-app text-app hover:border-[var(--accent)] hover:text-[var(--accent)]',
  ghost:
    'bg-[var(--surface)] border border-app text-app hover:border-[var(--primary)]',
  outline:
    'border border-[var(--primary)] text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white',
}

export default function GradientButton({
  children,
  variant = 'primary',
  className = '',
  to,
  type = 'button',
  onClick,
  disabled = false,
  fullWidth = false,
  icon: Icon,
}) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 font-medium text-sm sm:text-base transition-all duration-300 focus-ring disabled:opacity-50 disabled:cursor-not-allowed'

  const classes = cn(base, variants[variant], fullWidth && 'w-full', className)

  const content = (
    <>
      {Icon ? <Icon className="h-4 w-4 shrink-0" aria-hidden /> : null}
      {children}
    </>
  )

  if (to) {
    return (
      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className={fullWidth ? 'w-full' : 'inline-flex'}>
        <Link to={to} className={classes}>
          {content}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      className={classes}
    >
      {content}
    </motion.button>
  )
}
