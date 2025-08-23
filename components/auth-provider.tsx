"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { authAPI, getAuthToken, clearAuthToken } from "@/lib/api"

interface User {
  _id: string
  name: string
  email: string
  role: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
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

      const response = await authAPI.getProfile()
      if (response.success) {
        setUser(response.data.user)
      } else {
        clearAuthToken()
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      clearAuthToken()
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login(email, password)
      
      if (response.success) {
        setUser(response.data.user)
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
