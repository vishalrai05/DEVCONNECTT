import { Link } from 'react-router-dom'
import Logo from '../Logo'

const footerLinks = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '/#features' },
      { label: 'Hackathons', href: '/login' },
      { label: 'Team matching', href: '/#how-it-works' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Guides', href: '#' },
      { label: 'Support', href: '#' },
      { label: 'Status', href: '#' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="border-t border-app bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              The hackathon team formation platform for developers who want to ship winning projects together.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <h4 className="text-sm font-semibold text-app">{group.title}</h4>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => (
                  <li key={item.label}>
                    <a
                      href={item.href}
                      className="text-sm text-muted transition-colors hover:text-[var(--accent)]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-app pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted">© {new Date().getFullYear()} DevConnect. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted">
            <Link to="#" className="hover:text-app">
              Privacy
            </Link>
            <Link to="#" className="hover:text-app">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
