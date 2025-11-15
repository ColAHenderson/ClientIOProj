// src/context/AuthContext.tsx
import React, { createContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'


interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'CLIENT' | 'PRACTITIONER' | 'ADMIN'
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  email: string
  password: string
  firstName: string
  lastName: string
  role?: 'CLIENT' | 'PRACTITIONER'
}

interface AuthContextValue {
  user: AuthUser | null
  accessToken: string | null
  loading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<boolean>
  register: (payload: RegisterPayload) => Promise<boolean>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const AUTH_STORAGE_KEY = 'clientPortalAuth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    accessToken: null,
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as AuthState
        setState(parsed)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const persist = (next: AuthState) => {
    setState(next)
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next))
  }

  const login = async (payload: LoginPayload): Promise<boolean> => {
    try {
      setError(null)
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Invalid email or password.')
        }
        throw new Error(`Login failed with status ${res.status}`)
      }

      const data = await res.json()

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
      }

      persist({
        user,
        accessToken: data.tokens.accessToken,
      })

      return true
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message ?? 'Login failed')
      return false
    }
  }

  const register = async (payload: RegisterPayload): Promise<boolean> => {
    try {
      setError(null)
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          role: payload.role ?? 'CLIENT',
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 409) {
          throw new Error(body.message ?? 'Email already in use.')
        }
        throw new Error(`Registration failed with status ${res.status}`)
      }

      const data = await res.json()

      const user: AuthUser = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        role: data.user.role,
      }

      persist({
        user,
        accessToken: data.tokens.accessToken,
      })

      return true
    } catch (err: any) {
      console.error('Register error:', err)
      setError(err.message ?? 'Registration failed')
      return false
    }
  }

  const logout = () => {
    setState({ user: null, accessToken: null })
    localStorage.removeItem(AUTH_STORAGE_KEY)
  }

  const value: AuthContextValue = {
    user: state.user,
    accessToken: state.accessToken,
    loading,
    error,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}