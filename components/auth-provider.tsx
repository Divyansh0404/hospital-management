"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI, getAuthToken, clearAuthToken, setAuthToken } from "@/lib/api"

interface User {
  _id: string
  username: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  name?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string, rememberMe?: boolean) => Promise<boolean>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  const isAuthenticated = !!user

  // Check if user is logged in on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        await checkAuthStatus()
      } catch (error) {
        console.error("Failed to initialize auth:", error)
        setIsLoading(false)
      }
    }
    
    initAuth()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = getAuthToken()
      
      if (!token) {
        setIsLoading(false)
        return
      }

      // Check if token is expired for non-remembered sessions
      const isRemembered = localStorage.getItem('hospital_auth_remember') === 'true'
      const expirationTime = localStorage.getItem('hospital_auth_expiration')
      
      if (!isRemembered && expirationTime && Date.now() > parseInt(expirationTime)) {
        clearAuthToken()
        setIsLoading(false)
        return
      }

      const response = await authAPI.getProfile()
      if (response.success) {
        setUser(response.data.user)
      } else {
        clearAuthToken()
        localStorage.removeItem('hospital_auth_remember')
        localStorage.removeItem('hospital_auth_expiration')
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      clearAuthToken()
      localStorage.removeItem('hospital_auth_remember')
      localStorage.removeItem('hospital_auth_expiration')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password)
      
      if (response.success) {
        setUser(response.data.user)
        
        // Set token expiration based on "Remember Me"
        if (rememberMe) {
          // Store for longer period (30 days)
          localStorage.setItem('hospital_auth_remember', 'true')
          const expirationTime = Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
          localStorage.setItem('hospital_auth_expiration', expirationTime.toString())
        } else {
          // Store for session only
          localStorage.removeItem('hospital_auth_remember')
          localStorage.removeItem('hospital_auth_expiration')
        }
        
        return true
      }
      return false
    } catch (error) {
      console.error("Login failed:", error)
      return false
    }
  }

  const logout = () => {
    authAPI.logout()
    setUser(null)
    localStorage.removeItem('hospital_auth_remember')
    localStorage.removeItem('hospital_auth_expiration')
    localStorage.removeItem('remembered_email')
    localStorage.removeItem('remember_me')
    router.push("/login")
  }

  const refreshUser = async () => {
    try {
      const response = await authAPI.getProfile()
      if (response.success) {
        setUser(response.data.user)
      }
    } catch (error) {
      console.error("Failed to refresh user:", error)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
