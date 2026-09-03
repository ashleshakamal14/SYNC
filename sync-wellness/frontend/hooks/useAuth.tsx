'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import api from '@/lib/api'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, age?: number) => Promise<void>
  logout: () => void
  updateUser: (updated: User) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Restore session from localStorage
    const savedToken = localStorage.getItem('sync_token')
    const savedUser = localStorage.getItem('sync_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { access_token, user: userData } = res.data
    localStorage.setItem('sync_token', access_token)
    localStorage.setItem('sync_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
  }

  const register = async (name: string, email: string, password: string, age?: number) => {
    const res = await api.post('/api/auth/register', { name, email, password, age })
    const { access_token, user: userData } = res.data
    localStorage.setItem('sync_token', access_token)
    localStorage.setItem('sync_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('sync_token')
    localStorage.removeItem('sync_user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (updated: User) => {
    setUser(updated)
    localStorage.setItem('sync_user', JSON.stringify(updated))
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
