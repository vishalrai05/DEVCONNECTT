import jwt from 'jsonwebtoken'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import User from '../models/User.js'
import Team from '../models/Team.js'
import Message from '../models/Message.js'
import { formatMessage } from '../controllers/messageController.js'
import { createNotification } from '../models/Notification.js'
import { getJwtSecret } from '../utils/generateToken.js'

const roomFor = (teamId) => `team:${teamId}`
const onlineUsers = new Map()

const getCookie = (cookieHeader, name) => {
  const match = cookieHeader?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

const isTeamMember = async (teamId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(teamId)) return false
  return Boolean(await Team.exists({ _id: teamId, members: userId }))
}

const publicUser = (user) => ({
  _id: user._id,
  name: user.name,
  avatar: user.avatar || '',
  preferredRole: user.preferredRole || '',
})

const emitPresence = (io, teamId) => {
  const members = io.sockets.adapter.rooms.get(roomFor(teamId)) || new Set()
  const userIds = [...members]
    .map((socketId) => io.sockets.sockets.get(socketId)?.data.user?._id?.toString())
    .filter(Boolean)
  io.to(roomFor(teamId)).emit('presence:update', { teamId, userIds: [...new Set(userIds)] })
}

const updateConnectionPresence = (userId, delta) => {
  const key = userId.toString()
  const next = Math.max(0, (onlineUsers.get(key) || 0) + delta)
  if (next) onlineUsers.set(key, next)
  else onlineUsers.delete(key)
}

export const createSocketServer = (httpServer, clientUrl = 'http://localhost:5173') => {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  })

  io.use(async (socket, next) => {
    try {
      const token = getCookie(socket.handshake.headers.cookie, 'token')
      if (!token) return next(new Error('Authentication required.'))
      const decoded = jwt.verify(token, getJwtSecret())
      const user = await User.findById(decoded.id).select('name avatar preferredRole')
      if (!user) return next(new Error('Authentication required.'))
      socket.data.user = publicUser(user)
      next()
    } catch {
      next(new Error('Authentication failed.'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.data.user
    const messageWindow = []
    const messageLimit = process.env.NODE_ENV === 'production' ? 30 : 120
    updateConnectionPresence(user._id, 1)
    socket.data.teams = new Set()

    socket.on('team:join', async ({ teamId } = {}, acknowledge) => {
      try {
        if (!mongoose.Types.ObjectId.isValid(teamId) || !(await isTeamMember(teamId, user._id))) {
          throw new Error('Only team members can join this chat.')
        }
        const room = roomFor(teamId)
        await socket.join(room)
        socket.data.teams.add(teamId.toString())
        emitPresence(io, teamId)
        acknowledge?.({ ok: true })
      } catch (error) {
        acknowledge?.({ ok: false, message: error.message })
      }
    })

    socket.on('team:leave', ({ teamId } = {}) => {
      if (!teamId || !socket.data.teams.has(teamId.toString())) return
      socket.leave(roomFor(teamId))
      socket.data.teams.delete(teamId.toString())
      emitPresence(io, teamId)
    })

    socket.on('team:typing', async ({ teamId, isTyping } = {}) => {
      if (!socket.data.teams.has(String(teamId)) || !(await isTeamMember(teamId, user._id))) return
      socket.to(roomFor(teamId)).emit('team:typing', {
        teamId,
        user: publicUser(user),
        isTyping: Boolean(isTyping),
      })
    })

    socket.on('team:message', async ({ teamId, content } = {}, acknowledge) => {
      try {
        const now = Date.now()
        while (messageWindow.length && now - messageWindow[0] > 10_000) messageWindow.shift()
        if (messageWindow.length >= messageLimit) {
          throw new Error('You are sending messages too quickly. Please slow down.')
        }
        messageWindow.push(now)
        const text = typeof content === 'string' ? content.trim() : ''
        if (!text || text.length > 2000) throw new Error('Message must be between 1 and 2000 characters.')
        if (!socket.data.teams.has(String(teamId)) || !(await isTeamMember(teamId, user._id))) {
          throw new Error('Only team members can send messages.')
        }
        const saved = await Message.create({ team: teamId, sender: user._id, content: text })
        const populated = await Message.findById(saved._id).populate('sender', 'name avatar preferredRole').lean()
        const message = formatMessage(populated)
        io.to(roomFor(teamId)).emit('team:message', message)

        const activeUserIds = new Set(
          [...(io.sockets.adapter.rooms.get(roomFor(teamId)) || new Set())]
            .map((socketId) => io.sockets.sockets.get(socketId)?.data.user?._id?.toString())
            .filter(Boolean),
        )
        const team = await Team.findById(teamId).select('members')
        await Promise.all(
          (team?.members || [])
            .map((memberId) => memberId.toString())
            .filter((memberId) => memberId !== user._id.toString() && !activeUserIds.has(memberId))
            .map((memberId) =>
              createNotification({
                userId: memberId,
                type: 'team_message',
                message: `${user.name} sent a new message in your team chat.`,
                relatedTeam: teamId,
              }),
            ),
        )
        acknowledge?.({ ok: true, message })
      } catch (error) {
        acknowledge?.({ ok: false, message: error.message || 'Unable to send message.' })
      }
    })

    socket.on('disconnect', () => {
      for (const teamId of socket.data.teams) {
        socket.data.teams.delete(teamId)
        emitPresence(io, teamId)
      }
      updateConnectionPresence(user._id, -1)
    })
  })

  return io
}
