import assert from 'node:assert/strict'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import { sameOrigin } from '../middleware/securityMiddleware.js'

process.env.JWT_SECRET = 'test-secret-that-is-long-enough-for-unit-tests'

const { generateToken, setAuthCookie } = await import('./generateToken.js')

test('generates a seven-day JWT containing only the user id', () => {
  const token = generateToken('507f1f77bcf86cd799439011')
  const payload = jwt.verify(token, process.env.JWT_SECRET)

  assert.deepEqual(payload.id, '507f1f77bcf86cd799439011')
  assert.ok(payload.exp > payload.iat)
  assert.equal(Object.keys(payload).sort().join(','), 'exp,iat,id')
})

test('sets the auth cookie as HTTP-only', () => {
  const response = { cookie: (...args) => { response.args = args } }
  setAuthCookie(response, 'token-value')

  assert.equal(response.args[0], 'token')
  assert.equal(response.args[1], 'token-value')
  assert.equal(response.args[2].httpOnly, true)
  assert.equal(response.args[2].path, '/')
})

test('falls back to a dev JWT secret when env is missing', () => {
  const previousSecret = process.env.JWT_SECRET
  delete process.env.JWT_SECRET

  try {
    const token = generateToken('507f1f77bcf86cd799439011')
    const payload = jwt.verify(token, 'devconnect-development-secret')

    assert.equal(payload.id, '507f1f77bcf86cd799439011')
  } finally {
    process.env.JWT_SECRET = previousSecret
  }
})

test('allows localhost origin in dev when CLIENT_URL is unset', () => {
  const previousClientUrl = process.env.CLIENT_URL
  delete process.env.CLIENT_URL

  try {
    let called = false
    const req = {
      method: 'POST',
      get: (header) => (header === 'origin' ? 'http://localhost:5173' : undefined),
    }
    const res = { status: () => ({ json: () => {} }) }

    sameOrigin(req, res, () => {
      called = true
    })

    assert.equal(called, true)
  } finally {
    process.env.CLIENT_URL = previousClientUrl
  }
})
