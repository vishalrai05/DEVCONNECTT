/**
 * Module 5 — JWT helpers
 *
 * Why JWT?
 * A signed token proves the user's identity without storing session state
 * on the server. The client (via cookie) sends it on each request; middleware
 * verifies the signature and trusts the embedded user id.
 *
 * Why HTTP-only cookies instead of localStorage?
 * JavaScript on the page cannot read httpOnly cookies, which blocks most
 * XSS attacks from stealing the token. Cookies are also sent automatically
 * with withCredentials: true on the frontend.
 */

import jwt from 'jsonwebtoken'

/**
 * Create a signed JWT for the given user id.
 * Payload is intentionally minimal — only the id is needed to load the user.
 */
export const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    // 7-day expiry balances convenience (stay logged in) vs security
    { expiresIn: '7d' },
  )
}

/**
 * Attach the JWT as a secure HTTP-only cookie on the response.
 * Cookie settings matter: wrong sameSite/secure values break cross-origin
 * auth between Vite (5173) and Express (5000) in development.
 */
export const setAuthCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production'

  res.cookie('token', token, {
    httpOnly: true, // not accessible via document.cookie — XSS protection
    secure: isProduction, // HTTPS-only in production; false on localhost HTTP
    sameSite: isProduction ? 'none' : 'lax', // 'none' needed for cross-site HTTPS; 'lax' for local
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds — matches JWT expiry
    path: '/', // available to all API routes
  })
}

/**
 * Clear the auth cookie on logout.
 * Options must match how the cookie was set or the browser will ignore clear.
 */
export const clearAuthCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production'

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0), // expire immediately
    path: '/',
  })
}
