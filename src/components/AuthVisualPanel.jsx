import { motion } from 'framer-motion'
import StatsCard from './StatsCard'
import NetworkGraph from './NetworkGraph'
import ThemeToggle from './ThemeToggle'

export default function AuthVisualPanel({
  title = 'Your next winning team starts here',
  subtitle = 'Connect with developers, join active hackathons, and form squads that ship.',
}) {
  return (
    <div
      className="relative hidden min-h-full overflow-hidden lg:flex lg:flex-col lg:justify-between"
      style={{ background: 'var(--panel-gradient)' }}
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-blue-500/25 blur-[100px]" />
        <div className="absolute bottom-10 left-10 h-64 w-64 rounded-full bg-sky-400/15 blur-[90px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(37,99,235,0.18),transparent_45%)]" />
      </div>

      <div className="relative z-10 flex items-start justify-between p-8 xl:p-10">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--accent)]">
            Hackathon hub
          </p>
          <h2 className="mt-3 max-w-sm font-display text-3xl font-bold leading-tight text-app xl:text-4xl">
            {title}
          </h2>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">{subtitle}</p>
        </div>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex-1 px-6 xl:px-8">
        <NetworkGraph />
      </div>

      <div className="relative z-10 grid grid-cols-3 gap-3 p-6 xl:gap-4 xl:p-8">
        <StatsCard label="Active Hackathons" value="48" delay={0.15} />
        <StatsCard label="Teams Forming" value="312" delay={0.25} />
        <StatsCard label="Developers Online" value="2.4k" delay={0.35} />
      </div>

      <motion.div
        className="pointer-events-none absolute right-10 top-1/3 h-24 w-24 rounded-full border border-blue-400/20"
        animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.55, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
        aria-hidden
      />
    </div>
  )
}
