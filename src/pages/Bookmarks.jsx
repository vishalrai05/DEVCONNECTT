/**
 * Bookmarks page — saved hackathons for the logged-in user
 *
 * Loads GET /api/users/bookmarks and renders the same HackathonCard grid.
 * Removing a bookmark via the card icon triggers a local list update.
 */

import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import AppShell from '../components/layout/AppShell'
import HackathonCard from '../components/hackathons/HackathonCard'
import GradientButton from '../components/GradientButton'
import { getMyBookmarks, getErrorMessage } from '../api/hackathon'

export default function Bookmarks() {
  const [hackathons, setHackathons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getMyBookmarks()
      setHackathons(data.hackathons || [])
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <AppShell
      title="Bookmarks"
      description="Hackathons you saved for later — deadlines stay visible so you never miss registration."
    >
      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </p>
      ) : hackathons.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-app glass p-10 text-center">
          <p className="font-display text-xl font-semibold text-app">No bookmarks yet</p>
          <p className="mt-2 text-sm text-muted">
            Browse events and tap the bookmark icon on any card.
          </p>
          <div className="mt-6 flex justify-center">
            <GradientButton to="/hackathons">Discover hackathons</GradientButton>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {hackathons.map((h) => (
            <HackathonCard
              key={h._id}
              hackathon={{ ...h, isBookmarked: true }}
              onBookmarkChange={(bookmarked) => {
                if (!bookmarked) {
                  setHackathons((prev) => prev.filter((x) => x._id !== h._id))
                }
              }}
            />
          ))}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        Looking for something new?{' '}
        <Link to="/hackathons" className="text-[var(--accent)] hover:underline">
          Explore all hackathons
        </Link>
      </p>
    </AppShell>
  )
}
