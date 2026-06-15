import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  authApi,
  clearAuthStorage,
  getStoredUser,
  getToken,
  queryKeys,
  saveStoredUser,
  saveToken,
  useUser
} from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [token, setToken] = useState(() => getToken())
  const [storedUser, setStoredUser] = useState(() => getStoredUser())
  const userQuery = useUser(Boolean(token))

  useEffect(() => {
    setToken(getToken())
    if (userQuery.data?.user) {
      saveStoredUser(userQuery.data.user)
      setStoredUser(userQuery.data.user)
    }
  }, [userQuery.data?.user])

  useEffect(() => {
    const validateToken = async () => {
      const storedToken = getToken()
      if (!storedToken) {
        return
      }

      try {
        const response = await authApi.me()
        if (response?.user) {
          saveStoredUser(response.user)
          setStoredUser(response.user)
        }
      } catch {
        clearAuthStorage()
        setToken('')
        setStoredUser(null)
        if (
          window.location.pathname.startsWith('/dashboard') ||
          window.location.pathname.startsWith('/assets') ||
          window.location.pathname.startsWith('/contacts') ||
          window.location.pathname.startsWith('/will') ||
          window.location.pathname.startsWith('/tokens') ||
          window.location.pathname.startsWith('/security') ||
          window.location.pathname.startsWith('/beneficiary')
        ) {
          window.location.href = '/login'
        }
      }
    }

    validateToken()
  }, [])

  const completeAuth = (authToken, authUser) => {
    saveToken(authToken, authUser)
    setToken(authToken)
    setStoredUser(authUser || null)
    navigate('/dashboard')
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continue logout even if API call fails
      console.error('Logout API error:', error)
    }

    clearAuthStorage()
    setToken('')
    setStoredUser(null)
    navigate('/login')
  }

  const value = useMemo(
    () => ({
      token,
      isAuthenticated: Boolean(token),
      user: userQuery.data?.user || storedUser || null,
      userLoading: userQuery.isLoading,
      refreshUserKey: queryKeys.user,
      completeAuth,
      logout
    }),
    [token, storedUser, userQuery.data?.user, userQuery.isLoading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside AuthProvider')
  return value
}
