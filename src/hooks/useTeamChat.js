import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { getTeamMessages, getErrorMessage } from '../api/chat'

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export default function useTeamChat(teamId, enabled = true) {
  const socketRef = useRef(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(enabled)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [connected, setConnected] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const [onlineIds, setOnlineIds] = useState([])
  const [typingUser, setTypingUser] = useState(null)

  const loadHistory = useCallback(async (before) => {
    if (!teamId) return
    if (before) setLoadingOlder(true)
    else setLoading(true)
    try {
      const data = await getTeamMessages(teamId, { limit: 30, before })
      setMessages((current) => (before ? [...data.messages, ...current] : data.messages || []))
      setHasMore(Boolean(data.pagination?.hasMore))
      setNextCursor(data.pagination?.nextCursor || null)
      setError('')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
      setLoadingOlder(false)
    }
  }, [teamId])

  useEffect(() => {
    if (!enabled || !teamId) {
      setMessages([])
      setLoading(false)
      return undefined
    }

    let active = true
    const socket = io(SOCKET_URL, { withCredentials: true, autoConnect: true })
    socketRef.current = socket

    const onConnect = () => {
      if (!active) return
      setConnected(true)
      socket.emit('team:join', { teamId }, (result) => {
        if (!result?.ok) setError(result?.message || 'Unable to join team chat.')
      })
    }
    const onDisconnect = () => setConnected(false)
    const onConnectError = (err) => setError(err.message || 'Chat connection failed.')
    const onMessage = (message) => {
      if (String(message.team) !== String(teamId)) return
      setMessages((current) => (current.some((item) => item._id === message._id) ? current : [...current, message]))
    }
    const onPresence = ({ userIds = [] } = {}) => setOnlineIds(userIds.map(String))
    const onTyping = ({ user, isTyping } = {}) => {
      if (!user || String(user._id) === String(socket.data?.user?._id)) return
      setTypingUser(isTyping ? user : null)
    }

    loadHistory()
    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('connect_error', onConnectError)
    socket.on('team:message', onMessage)
    socket.on('presence:update', onPresence)
    socket.on('team:typing', onTyping)

    return () => {
      active = false
      socket.emit('team:leave', { teamId })
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, teamId, loadHistory])

  const sendMessage = useCallback((content) => {
    return new Promise((resolve) => {
      const socket = socketRef.current
      if (!socket?.connected) {
        setError('Chat is reconnecting. Please try again.')
        resolve(false)
        return
      }
      setSending(true)
      socket.timeout(8000).emit('team:message', { teamId, content }, (err, result) => {
        setSending(false)
        if (err || !result?.ok) {
          setError(result?.message || 'Unable to send message.')
          resolve(false)
          return
        }
        setError('')
        resolve(true)
      })
    })
  }, [teamId])

  const setTyping = useCallback((isTyping) => {
    socketRef.current?.emit('team:typing', { teamId, isTyping })
  }, [teamId])

  return {
    messages,
    loading,
    loadingOlder,
    sending,
    error,
    connected,
    hasMore,
    onlineIds,
    typingUser,
    loadOlder: () => (hasMore && nextCursor ? loadHistory(nextCursor) : Promise.resolve()),
    sendMessage,
    setTyping,
  }
}
