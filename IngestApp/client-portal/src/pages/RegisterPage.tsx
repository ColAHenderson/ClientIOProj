// src/pages/RegisterPage.tsx
import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const RegisterPage: React.FC = () => {
  const { register, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation() as any

  const prefilledEmail = location.state?.email ?? ''

  const [email, setEmail] = useState(prefilledEmail)
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'CLIENT' | 'PRACTITIONER'>('CLIENT')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const success = await register({
      email,
      password,
      firstName,
      lastName,
      role,
    })
    setSubmitting(false)
    if (success) {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      <h1 className="text-xl font-semibold mb-4">Create an account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">
              First name
            </label>
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">
              Last name
            </label>
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

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
            minLength={8}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-300">
            Account type
          </label>
          <select
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
            value={role}
            onChange={(e) => setRole(e.target.value as 'CLIENT' | 'PRACTITIONER')}
          >
            <option value="CLIENT">Client</option>
            <option value="PRACTITIONER">Practitioner</option>
          </select>
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
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-4 text-xs text-slate-400">
        Already have an account?{' '}
        <a href="/login" className="text-sky-400 hover:underline">
          Login
        </a>
      </p>
    </div>
  )
}

export default RegisterPage