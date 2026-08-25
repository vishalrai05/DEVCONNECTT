/**
 * BookmarkButton — toggle save state for a hackathon
 *
 * How bookmarks work (UI):
 * - Optimistic flip of `bookmarked` local state for snappy feedback
 * - Calls POST or DELETE /api/hackathons/:id/bookmark
 * - Guests are sent to /login (bookmarks require auth)
 * - Framer Motion scales the icon on tap
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bookmark, BookmarkCheck, Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { bookmarkHackathon, unbookmarkHackathon, getErrorMessage } from '../../api/hackathon'
import { cn } from '../../utils/cn'

export default function BookmarkButton({
  hackathonId,
  initialBookmarked = false,
  onChange,
  className = '',
  size = 'md',
}) {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [bookmarked, setBookmarked] = useState(Boolean(initialBookmarked))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Sync when parent refetches and passes a new isBookmarked flag
  useEffect(() => {
    setBookmarked(Boolean(initialBookmarked))
  }, [initialBookmarked, hackathonId])

  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5'

  const toggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setError('')

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/hackathons/${hackathonId}` } })
      return
    }

    const next = !bookmarked
    setBookmarked(next) // optimistic
    setLoading(true)

    try {
      if (next) await bookmarkHackathon(hackathonId)
      else await unbookmarkHackathon(hackathonId)
      onChange?.(next)
    } catch (err) {
      setBookmarked(!next) // rollback
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('relative', className)}>
      <motion.button
        type="button"
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
        onClick={toggle}
        disabled={loading}
        aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark hackathon'}
        className={cn(
          'inline-flex items-center justify-center rounded-xl border border-app bg-[var(--surface)] p-2 text-muted transition-colors hover:text-[var(--primary)] focus-ring disabled:opacity-60',
          bookmarked && 'border-[var(--primary)]/40 text-[var(--primary)]',
        )}
      >
        {loading ? (
          <Loader2 className={cn(iconSize, 'animate-spin')} />
        ) : bookmarked ? (
          <BookmarkCheck className={iconSize} />
        ) : (
          <Bookmark className={iconSize} />
        )}
      </motion.button>
      {error ? (
        <p className="absolute right-0 top-full z-10 mt-1 w-40 rounded-lg bg-red-500/10 px-2 py-1 text-[10px] text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  )
}
