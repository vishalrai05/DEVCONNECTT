import { motion } from 'framer-motion'
import { cn } from '../utils/cn'

export default function FeatureCard({ icon: Icon, title, description, index = 0 }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, scale: 1.01 }}
      className={cn(
        'group relative rounded-3xl border border-app bg-card p-6 sm:p-7',
        'transition-shadow duration-300 hover:shadow-xl hover:shadow-blue-600/10',
      )}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500/0 via-transparent to-blue-500/0 opacity-0 transition-opacity duration-300 group-hover:from-blue-500/5 group-hover:to-blue-500/10 group-hover:opacity-100" />
      <div className="relative">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--accent)] ring-1 ring-[var(--primary)]/20">
          <Icon className="h-5 w-5" aria-hidden />
        </div>
        <h3 className="font-display text-lg font-semibold text-app">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </motion.article>
  )
}
