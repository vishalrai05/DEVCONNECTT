import rateLimit from 'express-rate-limit'

const isProduction = () => process.env.NODE_ENV === 'production'

export const sameOrigin = (req, res, next) => {
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return next()
  const origin = req.get('origin')
  const allowedOrigin = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '')

  if (origin && origin.replace(/\/$/, '') !== allowedOrigin) {
    return res.status(403).json({ success: false, message: 'Request origin is not allowed.' })
  }
  next()
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: () => (isProduction() ? 20 : 100),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts. Try again later.' },
})

export const mutationLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: () => (isProduction() ? 60 : 300),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again shortly.' },
})

export const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: () => (isProduction() ? 120 : 600),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many chat requests. Please slow down.' },
})

export const validateProductionConfig = () => {
  if (!isProduction()) return

  const required = ['MONGO_URI', 'JWT_SECRET', 'CLIENT_URL']
  const missing = required.filter((key) => !process.env[key]?.trim())
  const weakSecret = (process.env.JWT_SECRET || '').length < 32
  const placeholderSecret = /change_this|secret|replace_me/i.test(process.env.JWT_SECRET || '')
  const invalidClientUrl = !/^https:\/\//i.test(process.env.CLIENT_URL || '')

  if (missing.length || weakSecret || placeholderSecret || invalidClientUrl) {
    const problems = [
      missing.length ? `missing ${missing.join(', ')}` : '',
      weakSecret || placeholderSecret ? 'JWT_SECRET must be a long random value' : '',
      invalidClientUrl ? 'CLIENT_URL must use HTTPS' : '',
    ].filter(Boolean)
    throw new Error(`Invalid production configuration: ${problems.join('; ')}`)
  }
}
