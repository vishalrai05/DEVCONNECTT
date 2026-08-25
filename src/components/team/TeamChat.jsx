import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, MessageCircle, Send, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import useTeamChat from '../../hooks/useTeamChat'
import MemberAvatar from './MemberAvatar'
import { timeAgo } from '../../utils/teams'
import { cn } from '../../utils/cn'

const formatTime = (value) => {
  if (!value) return ''
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(value))
}

export default function TeamChat({ team }) {
  const { user: currentUser } = useAuth()
  const [draft, setDraft] = useState('')
  const [unread, setUnread] = useState(0)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const listRef = useRef(null)
  const typingTimer = useRef(null)
  const {
    messages,
    loading,
    loadingOlder,
    sending,
    error,
    connected,
    hasMore,
    onlineIds,
    typingUser,
    loadOlder,
    sendMessage,
    setTyping,
  } = useTeamChat(team._id, true)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    if (isNearBottom) list.scrollTop = list.scrollHeight
    else if (messages.length) setUnread((count) => count + 1)
  }, [messages.length, isNearBottom])

  useEffect(() => () => clearTimeout(typingTimer.current), [])

  const handleScroll = () => {
    const list = listRef.current
    if (!list) return
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80
    setIsNearBottom(nearBottom)
    if (nearBottom) setUnread(0)
  }

  const handleDraftChange = (event) => {
    setDraft(event.target.value)
    setTyping(true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => setTyping(false), 900)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const content = draft.trim()
    if (!content || sending) return
    setTyping(false)
    const sent = await sendMessage(content)
    if (sent) {
      setDraft('')
      setIsNearBottom(true)
    }
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-app glass">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-app px-5 py-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <h2 className="font-display text-xl font-bold text-app">Team chat</h2>
            <p className="text-xs text-muted">{team.members?.length || 0} members</p>
          </div>
        </div>
        <span className={cn('inline-flex items-center gap-1.5 text-xs', connected ? 'text-emerald-500' : 'text-amber-500')}>
          {connected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
          {connected ? 'Connected' : 'Reconnecting'}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-app px-5 py-3">
        {(team.members || []).map((member) => (
          <Link key={member._id} to={`/profile/${member._id}`} className="relative" title={`${member.name}${onlineIds.includes(String(member._id)) ? ' - online' : ' - offline'}`}>
            <MemberAvatar user={member} size="sm" />
            <span className={cn('absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface)]', onlineIds.includes(String(member._id)) ? 'bg-emerald-500' : 'bg-slate-400')} />
          </Link>
        ))}
      </div>

      <div ref={listRef} onScroll={handleScroll} className="flex h-[min(55vh,30rem)] min-h-[20rem] flex-col gap-3 overflow-y-auto px-4 py-4 sm:px-5">
        {hasMore ? (
          <button type="button" onClick={loadOlder} disabled={loadingOlder} className="self-center text-xs text-[var(--accent)] hover:underline">
            {loadingOlder ? 'Loading older messages...' : 'Load older messages'}
          </button>
        ) : null}
        {loading ? (
          <div className="flex flex-1 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-sm text-muted">
            <MessageCircle className="mb-2 h-8 w-8" />
            No messages yet. Start the conversation.
          </div>
        ) : (
          messages.map((message) => {
            const mine = String(message.sender?._id) === String(currentUser?._id)
            return (
              <div key={message._id} className={cn('flex max-w-[88%] gap-2', mine ? 'self-end flex-row-reverse' : 'self-start')}>
                <MemberAvatar user={message.sender} size="sm" />
                <div>
                  <div className={cn('rounded-2xl px-3.5 py-2.5 text-sm', mine ? 'rounded-br-md bg-[var(--primary)] text-white' : 'rounded-bl-md bg-[var(--surface)] text-app')}>
                    {!mine ? <p className="mb-1 text-xs font-semibold text-[var(--accent)]">{message.sender?.name || 'Team member'}</p> : null}
                    <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  <p className={cn('mt-1 text-[10px] text-muted', mine && 'text-right')} title={timeAgo(message.createdAt)}>{formatTime(message.createdAt)}</p>
                </div>
              </div>
            )
          })
        )}
        {typingUser ? <p className="text-xs italic text-muted">{typingUser.name} is typing...</p> : null}
      </div>

      {unread > 0 && !isNearBottom ? <button type="button" onClick={() => { setIsNearBottom(true); setUnread(0) }} className="mx-auto mb-2 block rounded-full bg-[var(--primary)] px-3 py-1 text-xs text-white">{unread} new message{unread === 1 ? '' : 's'}</button> : null}
      {error ? <p className="border-t border-red-500/20 bg-red-500/10 px-5 py-2 text-xs text-red-400">{error}</p> : null}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-app p-4">
        <input value={draft} onChange={handleDraftChange} maxLength={2000} disabled={!connected || sending} placeholder="Write a message..." aria-label="Message" className="min-w-0 flex-1 rounded-xl border border-app bg-[var(--surface)] px-3 py-2.5 text-sm text-app focus-ring" />
        <button type="submit" disabled={!connected || sending || !draft.trim()} aria-label="Send message" className="inline-flex items-center justify-center rounded-xl bg-[var(--primary)] px-3 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </section>
  )
}
