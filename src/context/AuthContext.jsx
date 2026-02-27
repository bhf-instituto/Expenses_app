/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getMe, loginUser, logoutUser, registerUser } from '../services/authApi.js'
import { setsSnapshotStorage } from '../lib/setsSnapshotStorage.js'
import { tokenStorage } from '../lib/tokenStorage.js'
import { userSnapshotStorage } from '../lib/userSnapshotStorage.js'

const AuthContext = createContext(null)

function extractToken(payload) {
  return (
    payload?.token
    ?? payload?.accessToken
    ?? payload?.access_token
    ?? payload?.jwt
    ?? payload?.data?.token
    ?? payload?.data?.accessToken
    ?? payload?.data?.access_token
    ?? payload?.data?.jwt
    ?? null
  )
}

function extractUser(payload) {
  if (payload?.user) return payload.user
  if (payload?.data?.user) return payload.data.user
  if (payload?.profile) return payload.profile

  if (payload?.id || payload?.email || payload?.name) {
    return payload
  }

  return null
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => tokenStorage.get())
  const [user, setUser] = useState(() => userSnapshotStorage.get())
  const [bootstrapping, setBootstrapping] = useState(true)

  const clearSession = useCallback(() => {
    tokenStorage.clear()
    userSnapshotStorage.clear()
    setsSnapshotStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    const data = await getMe()
    const nextUser = extractUser(data)
    setUser(nextUser)
    if (nextUser) {
      userSnapshotStorage.set(nextUser)
    }
    return nextUser
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function bootstrapSession() {
      try {
        const nextUser = await refreshMe()

        if (!nextUser) {
          userSnapshotStorage.clear()
          setUser(null)
        }
      } catch (error) {
        const isNetworkIssue = !error?.response
        const cachedUser = userSnapshotStorage.get()

        if (isNetworkIssue && cachedUser) {
          setUser(cachedUser)
        } else if (!isNetworkIssue) {
          clearSession()
        }
      } finally {
        if (!isCancelled) {
          setBootstrapping(false)
        }
      }
    }

    bootstrapSession()

    return () => {
      isCancelled = true
    }
  }, [refreshMe, clearSession])

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials)
    const nextToken = extractToken(data)

    if (nextToken) {
      tokenStorage.set(nextToken)
      setToken(nextToken)
    }

    const nextUser = extractUser(data)

    if (nextUser) {
      setUser(nextUser)
      userSnapshotStorage.set(nextUser)
      return nextUser
    }

    return refreshMe()
  }, [refreshMe])

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload)
    const nextToken = extractToken(data)

    if (nextToken) {
      tokenStorage.set(nextToken)
      setToken(nextToken)
    }

    const nextUser = extractUser(data)

    if (nextUser) {
      setUser(nextUser)
      userSnapshotStorage.set(nextUser)
      return nextUser
    }

    if (nextToken) {
      return refreshMe()
    }

    return null
  }, [refreshMe])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const value = useMemo(
    () => ({
      user,
      token,
      bootstrapping,
      isAuthenticated: Boolean(token || user),
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, token, bootstrapping, login, register, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
