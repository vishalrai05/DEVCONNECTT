/**
 * Frontend auth API client
 *
 * Why Axios instead of fetch?
 * Axios gives a cleaner API for JSON, interceptors, and credentials.
 *
 * Why withCredentials: true?
 * Without it, the browser will NOT send or accept HTTP-only cookies on
 * cross-origin requests (Vite :5173 → Express :5000). That would break
 * login/register persistence and /me session restore.
 */

import axios from 'axios'

// Prefer env override; fall back to local Express API during development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Shared Axios instance for all auth calls.
 * baseURL keeps paths short; withCredentials enables cookie auth.
 */
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Turn Axios/network failures into a single user-friendly message.
 * Controllers return { success, message } — prefer that message when present.
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message
  }

  if (error.message === 'Network Error' || !error.response) {
    return 'Unable to reach the server. Check your connection and try again.'
  }

  if (error.response?.status >= 500) {
    return 'Server error. Please try again later.'
  }

  return 'Something went wrong. Please try again.'
}

/** POST /api/auth/register — creates account and sets auth cookie */
export const register = async ({ name, email, password }) => {
  const { data } = await api.post('/auth/register', { name, email, password })
  return data
}

/** POST /api/auth/login — verifies credentials and sets auth cookie */
export const login = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

/** POST /api/auth/logout — clears the auth cookie on the server */
export const logout = async () => {
  const { data } = await api.post('/auth/logout')
  return data
}

/**
 * GET /api/auth/me — returns the current user if the cookie JWT is valid.
 * Called on app load so refreshing the page keeps the user logged in.
 */
export const getMe = async () => {
  const { data } = await api.get('/auth/me')
  return data
}

export default api
