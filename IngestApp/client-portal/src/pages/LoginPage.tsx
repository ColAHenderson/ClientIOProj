/// src/pages/LoginPage.tsx
import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginPage: React.FC = () => {
  const { login, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any

  const prefilledEmail = location.state?.email ?? ''

  const [email, setEmail] = useState(prefilledEmail)
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const success = await login({ email, password })
    setSubmitting(false)

    if (success) {
      const redirectTo = location.state?.from?.pathname ?? '/'
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-300">Email</label>
          <input
            type="email"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-300">Password</label>
          <input
            type="password"
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Login'}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        Don&apos;t have an account?{' '}
        <a href="/register" className="text-sky-400 hover:underline">
          Register
        </a>
      </p>
    </div>
  )
}

export default LoginPage