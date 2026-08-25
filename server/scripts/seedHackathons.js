/**
 * Seed script — populates sample hackathons for Phase 4 discovery UI.
 *
 * Usage (from server/):
 *   node scripts/seedHackathons.js
 *
 * Why a seed?
 * Empty MongoDB makes search/filters/countdowns hard to demo. This inserts
 * a curated set of upcoming events with varied modes, domains, and prizes.
 */

import dotenv from 'dotenv'
import connectDB from '../config/db.js'
import Hackathon from '../models/Hackathon.js'
import User from '../models/User.js'

dotenv.config()

const daysFromNow = (days, hours = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(d.getHours() + hours, 0, 0, 0)
  return d
}

const samples = [
  {
    title: 'DevConnect Open Source Sprint',
    organizer: 'DevConnect',
    description:
      'Build open-source tools for student hackers. Focus on React, Node, and developer experience. Mentors from industry will review submissions live.',
    startDate: daysFromNow(21),
    endDate: daysFromNow(23),
    registrationDeadline: daysFromNow(14),
    mode: 'online',
    location: '',
    prizePool: 150000,
    teamSizeMin: 2,
    teamSizeMax: 4,
    domains: ['Web Development', 'Cloud'],
    requiredSkills: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
    difficulty: 'intermediate',
    registrationLink: 'https://example.com/register/oss-sprint',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=80',
    isFeatured: true,
  },
  {
    title: 'AI for Good Hack',
    organizer: 'Campus AI Club',
    description:
      'Solve real social-impact problems with machine learning. Datasets provided for healthcare, education, and climate tracks.',
    startDate: daysFromNow(10),
    endDate: daysFromNow(12),
    registrationDeadline: daysFromNow(1, 12),
    mode: 'hybrid',
    location: 'IIT Delhi + Online',
    prizePool: 250000,
    teamSizeMin: 1,
    teamSizeMax: 5,
    domains: ['AI/ML'],
    requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'NLP'],
    difficulty: 'advanced',
    registrationLink: 'https://example.com/register/ai-good',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=80',
    isFeatured: true,
  },
  {
    title: 'Beginner Web Jam',
    organizer: 'CodeNewbie India',
    description:
      'Your first hackathon! Build a simple web app with HTML, CSS, and JavaScript. Workshops included for absolute beginners.',
    startDate: daysFromNow(30),
    endDate: daysFromNow(31),
    registrationDeadline: daysFromNow(25),
    mode: 'online',
    location: '',
    prizePool: 25000,
    teamSizeMin: 1,
    teamSizeMax: 3,
    domains: ['Web Development'],
    requiredSkills: ['HTML', 'CSS', 'JavaScript', 'React'],
    difficulty: 'beginner',
    registrationLink: 'https://example.com/register/web-jam',
    image: 'https://images.unsplash.com/photo-1498050108023-c8199c63c9ad?w=1200&q=80',
    isFeatured: false,
  },
  {
    title: 'ChainForge Blockchain Challenge',
    organizer: 'Web3 Guild',
    description:
      'Ship smart contracts and dApps on Ethereum testnets. Tracks for DeFi, NFTs, and public goods funding.',
    startDate: daysFromNow(40),
    endDate: daysFromNow(42),
    registrationDeadline: daysFromNow(35),
    mode: 'offline',
    location: 'Bengaluru',
    prizePool: 500000,
    teamSizeMin: 2,
    teamSizeMax: 5,
    domains: ['Blockchain'],
    requiredSkills: ['Solidity', 'JavaScript', 'Web3.js', 'React'],
    difficulty: 'advanced',
    registrationLink: 'https://example.com/register/chainforge',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80',
    isFeatured: true,
  },
  {
    title: 'SecureNet CTF Weekend',
    organizer: 'NullSec',
    description:
      'Capture-the-flag style cybersecurity competition with web, crypto, and forensics challenges for student teams.',
    startDate: daysFromNow(7),
    endDate: daysFromNow(8),
    registrationDeadline: daysFromNow(0, 20),
    mode: 'online',
    location: '',
    prizePool: 75000,
    teamSizeMin: 1,
    teamSizeMax: 4,
    domains: ['Cybersecurity'],
    requiredSkills: ['Linux', 'Python', 'Networking', 'OWASP'],
    difficulty: 'intermediate',
    registrationLink: 'https://example.com/register/securenet',
    image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1200&q=80',
    isFeatured: false,
  },
  {
    title: 'Mobile Momentum',
    organizer: 'Flutter India',
    description:
      'Build delightful mobile experiences with Flutter or React Native. Judging on UX polish and offline-first design.',
    startDate: daysFromNow(18),
    endDate: daysFromNow(19),
    registrationDeadline: daysFromNow(12),
    mode: 'hybrid',
    location: 'Hyderabad + Online',
    prizePool: 100000,
    teamSizeMin: 2,
    teamSizeMax: 4,
    domains: ['Mobile'],
    requiredSkills: ['Flutter', 'React Native', 'Dart', 'Firebase'],
    difficulty: 'intermediate',
    registrationLink: 'https://example.com/register/mobile-momentum',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58b7fec?w=1200&q=80',
    isFeatured: false,
  },
  {
    title: 'IoT City Lab',
    organizer: 'Smart Campus Lab',
    description:
      'Prototype IoT solutions for campus energy, transit, and safety. Hardware kits available on-site.',
    startDate: daysFromNow(28),
    endDate: daysFromNow(29),
    registrationDeadline: daysFromNow(20),
    mode: 'offline',
    location: 'Pune',
    prizePool: 80000,
    teamSizeMin: 3,
    teamSizeMax: 6,
    domains: ['IoT', 'Cloud'],
    requiredSkills: ['Arduino', 'MQTT', 'Python', 'AWS'],
    difficulty: 'intermediate',
    registrationLink: 'https://example.com/register/iot-city',
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80',
    isFeatured: false,
  },
  {
    title: 'Cloud Native Builders',
    organizer: 'Kube Collective',
    description:
      'Design scalable cloud architectures with Kubernetes and serverless. Includes a production-readiness checklist.',
    startDate: daysFromNow(45),
    endDate: daysFromNow(47),
    registrationDeadline: daysFromNow(38),
    mode: 'online',
    location: '',
    prizePool: 120000,
    teamSizeMin: 2,
    teamSizeMax: 5,
    domains: ['Cloud'],
    requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'Go'],
    difficulty: 'advanced',
    registrationLink: 'https://example.com/register/cloud-native',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80',
    isFeatured: false,
  },
]

const run = async () => {
  await connectDB()

  // Promote first admin email if present in env; otherwise leave roles alone
  if (process.env.ADMIN_EMAIL) {
    const admin = await User.findOneAndUpdate(
      { email: process.env.ADMIN_EMAIL.toLowerCase() },
      { role: 'admin' },
      { new: true },
    )
    if (admin) console.log(`Promoted admin: ${admin.email}`)
    else console.log(`No user found for ADMIN_EMAIL=${process.env.ADMIN_EMAIL}`)
  }

  const count = await Hackathon.countDocuments()
  if (count > 0 && process.argv.includes('--force') === false) {
    console.log(`Hackathons already exist (${count}). Pass --force to wipe and reseed.`)
    process.exit(0)
  }

  if (process.argv.includes('--force')) {
    await Hackathon.deleteMany({})
    console.log('Cleared existing hackathons.')
  }

  await Hackathon.insertMany(samples)
  console.log(`Seeded ${samples.length} hackathons.`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
