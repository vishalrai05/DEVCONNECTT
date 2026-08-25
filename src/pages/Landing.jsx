import { motion } from 'framer-motion'
import {
  ArrowRight,
  Code2,
  MessageSquare,
  Search,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from 'lucide-react'
import FeatureCard from '../components/FeatureCard'
import GradientButton from '../components/GradientButton'
import ParticleField from '../components/ParticleField'
import Footer from '../components/layout/Footer'

const features = [
  {
    icon: Search,
    title: 'Discover talent fast',
    description:
      'Browse developer profiles by stack, role, and availability so you can assemble a balanced hackathon squad in minutes.',
  },
  {
    icon: Users,
    title: 'Form winning teams',
    description:
      'Match with teammates who complement your skills — frontend, backend, design, ML — and lock in before the clock starts.',
  },
  {
    icon: Trophy,
    title: 'Join live hackathons',
    description:
      'Explore upcoming and active hackathons, filter by theme or prize track, and register your team with one flow.',
  },
  {
    icon: MessageSquare,
    title: 'Collaborate in real time',
    description:
      'Coordinate pitch ideas, share progress, and stay aligned with lightweight messaging built for short hackathon sprints.',
  },
  {
    icon: Code2,
    title: 'Skill-based matching',
    description:
      'Surface the right people for your idea with tags, experience signals, and preferred roles — not endless DMs.',
  },
  {
    icon: Zap,
    title: 'Ship under pressure',
    description:
      'From kickoff to demo day, keep roles clear and momentum high so your team can focus on building something great.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Create your profile',
    text: 'Add your stack, preferred roles, and the hackathons you care about.',
  },
  {
    step: '02',
    title: 'Find your teammates',
    text: 'Browse matches or post a team request with the skills you still need.',
  },
  {
    step: '03',
    title: 'Compete together',
    text: 'Join the hackathon, collaborate, and bring your project to the finish line.',
  },
]

export default function Landing() {
  return (
    <div className="relative min-h-svh overflow-hidden bg-app">
      <ParticleField />

      <main>
        {/* Hero */}
        <section className="relative mx-auto flex max-w-6xl flex-col items-center px-4 pb-20 pt-32 text-center sm:px-6 sm:pt-36 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-app bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden />
            Built for hackathon builders
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="font-display max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-app sm:text-5xl lg:text-6xl"
          >
            Build Winning Teams for Your{' '}
            <span className="text-gradient">Next Hackathon</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.12 }}
            className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg"
          >
            Find skilled developers, join hackathons, and collaborate with the right teammates in minutes.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.18 }}
            className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <GradientButton to="/signup" icon={ArrowRight}>
              Get Started
            </GradientButton>
            <GradientButton to="/login" variant="secondary">
              Explore Hackathons
            </GradientButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="relative mt-16 w-full max-w-4xl"
          >
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-r from-blue-600/20 via-sky-400/10 to-blue-600/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-3xl border border-app bg-card/90 p-4 shadow-2xl shadow-blue-950/30 backdrop-blur-sm sm:p-6">
              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Active hackathons', value: '48' },
                  { label: 'Teams forming', value: '312' },
                  { label: 'Developers ready', value: '2.4k' },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    animate={{ y: [0, i % 2 === 0 ? -6 : 6, 0] }}
                    transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
                    className="rounded-2xl border border-app bg-[var(--surface)]/80 p-5 text-left"
                  >
                    <p className="text-xs uppercase tracking-wider text-muted">{stat.label}</p>
                    <p className="mt-2 font-display text-3xl font-bold text-gradient">{stat.value}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl border border-dashed border-app bg-[var(--bg)]/50 p-5 text-left">
                <p className="text-sm font-medium text-app">Tonight&apos;s matches</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {['Full-stack · React', 'ML · PyTorch', 'Design · Figma', 'Backend · Node'].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="rounded-xl border border-app bg-card px-3 py-1.5 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section id="features" className="relative scroll-mt-24 border-t border-app bg-surface/50 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-app sm:text-4xl">
                Everything you need to compete
              </h2>
              <p className="mt-3 text-muted">
                DevConnect streamlines discovery, matching, and collaboration so your hackathon weekend starts strong.
              </p>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <FeatureCard key={feature.title} {...feature} index={index} />
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="relative scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-bold tracking-tight text-app sm:text-4xl">
                From solo to squad in three steps
              </h2>
              <p className="mt-3 text-muted">
                A simple path from idea to a team that can actually ship before demo day.
              </p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-3xl border border-app bg-card p-6"
                >
                  <span className="font-display text-sm font-bold text-[var(--accent)]">{item.step}</span>
                  <h3 className="mt-3 font-display text-lg font-semibold text-app">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative pb-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative overflow-hidden rounded-3xl border border-app bg-card px-6 py-12 text-center sm:px-12"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/15 via-transparent to-sky-400/10" />
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-app sm:text-3xl">
                  Ready for your next hackathon?
                </h2>
                <p className="mx-auto mt-3 max-w-lg text-muted">
                  Create an account, find your teammates, and start building with confidence.
                </p>
                <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <GradientButton to="/signup">Get Started</GradientButton>
                  <GradientButton to="/login" variant="ghost">
                    Explore Hackathons
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
