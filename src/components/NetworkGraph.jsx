import { motion } from 'framer-motion'

const nodes = [
  { x: 18, y: 28, size: 'XL' },
  { x: 42, y: 18, size: 'React' },
  { x: 68, y: 32, label: 'AI' },
  { x: 82, y: 58, label: 'Go' },
  { x: 58, y: 72, label: 'UX' },
  { x: 28, y: 68, label: 'Cloud' },
  { x: 48, y: 48, label: 'You' },
]

const edges = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [4, 5],
  [5, 0],
  [6, 0],
  [6, 1],
  [6, 2],
  [6, 4],
  [6, 5],
]

export default function NetworkGraph() {
  return (
    <div className="relative h-full min-h-[280px] w-full" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {edges.map(([a, b], i) => {
          const n1 = nodes[a]
          const n2 = nodes[b]
          return (
            <motion.line
              key={`${a}-${b}`}
              x1={n1.x}
              y1={n1.y}
              x2={n2.x}
              y2={n2.y}
              stroke="url(#edgeGrad)"
              strokeWidth="0.35"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.55, 0.2] }}
              transition={{ duration: 3.5 + i * 0.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )
        })}
        <defs>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.5" />
          </linearGradient>
        </defs>
      </svg>

      {nodes.map((node, i) => (
        <motion.div
          key={node.label}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          animate={{ y: [0, i % 2 === 0 ? -6 : 6, 0] }}
          transition={{ duration: 4 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div
            className={`flex items-center justify-center rounded-full border border-blue-400/30 bg-blue-500/15 backdrop-blur-md ${
              node.label === 'You'
                ? 'h-12 w-12 text-xs font-semibold text-white shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/50'
                : 'h-9 w-9 text-[10px] font-medium text-blue-100'
            }`}
          >
            {node.label}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
