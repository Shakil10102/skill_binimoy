import React, { createContext, useContext, useState, useEffect } from 'react'
import { getToken, getCurrentUser, removeToken } from '../services/api'
import { profileService } from '../services/profileService'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getCurrentUser())
  const [token, setTokenState] = useState(getToken())
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getToken()
      if (storedToken) {
        try {
          const data = await profileService.getProfile()
          if (data.user) {
            setUser(data.user)
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err)
          if (err.status === 401) {
            logout()
          }
        }
      }
      setIsLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    setUser(data.user)
    setTokenState(data.token)
    return data
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setTokenState(null)
  }

  const updateUserData = (updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields }
      localStorage.setItem('user', JSON.stringify(updated))
      return updated
    })
  }

  const refreshProfile = async () => {
    try {
      const data = await profileService.getProfile()
      if (data.user) {
        setUser(data.user)
      }
      return data.user
    } catch (e) {
      console.error('Error refreshing profile:', e)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token && user),
        isLoading,
        login,
        logout,
        updateUserData,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
