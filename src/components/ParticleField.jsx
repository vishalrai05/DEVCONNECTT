import { useMemo } from 'react'
import { motion } from 'framer-motion'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

export default function ParticleField({ count = 36, className = '' }) {
  const particles = useMemo(() => {
    const rand = seededRandom(42)
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: rand() * 100,
      y: rand() * 100,
      size: 1.5 + rand() * 2.5,
      duration: 8 + rand() * 12,
      delay: rand() * 6,
      opacity: 0.15 + rand() * 0.35,
    }))
  }, [count])

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-blue-600/20 blur-[100px]" />
      <div className="absolute -right-16 top-40 h-80 w-80 rounded-full bg-sky-400/15 blur-[110px]" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-500/10 blur-[90px]" />
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-[var(--accent)]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -18, 0, 12, 0],
            x: [0, 8, 0, -6, 0],
            opacity: [p.opacity, p.opacity * 1.4, p.opacity],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}
