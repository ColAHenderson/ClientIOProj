// src/pages/HomePage.tsx
import React, { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'


const HomePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetStarted = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Please enter an email address.')
      return
    }

    try {
      setSubmitting(true)

      const res = await fetch(`${API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      })

      if (!res.ok) {
        throw new Error(`Failed with status ${res.status}`)
      }

      const data = await res.json()

      if (data.exists) {
        // Known user → go to login, prefill email
        navigate('/login', { state: { email: trimmed } })
      } else {
        // New user → go to register, prefill email
        navigate('/register', { state: { email: trimmed } })
      }
    } catch (err: any) {
      console.error('check-email error:', err)
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Hero */}
      <section className="grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] items-center mt-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            A smarter way to handle{' '}
            <span className="text-sky-400">client intake &amp; appointments</span>.
          </h1>
          <p className="text-slate-300 mb-6 max-w-xl">
            ClientPortal.io gives your practice a modern, secure portal for bookings,
            intake forms, and post-session notes—without endless email back-and-forth.
          </p>

          {/* If already logged in, simple CTA */}
          {user ? (
            <div className="flex flex-wrap gap-3">
              {user.role === 'CLIENT' && (
                <button
                  onClick={() => navigate('/dashboard/client')}
                  className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-400"
                >
                  Go to my dashboard
                </button>
              )}
              {user.role !== 'CLIENT' && (
                <button
                  onClick={() => navigate('/dashboard/practitioner')}
                  className="rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-sky-400"
                >
                  Open practitioner view
                </button>
              )}
            </div>
          ) : (
            // Not logged in → email capture flow
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 max-w-md">
              <h2 className="text-sm font-semibold mb-2">
                Book now in 30 seconds
              </h2>
              <p className="text-xs text-slate-400 mb-3">
                Enter your email to get started. We&apos;ll check if you already have an account
                and route you to the right place.
              </p>
              <form onSubmit={handleGetStarted} className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-slate-300">
                    Email address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-sky-500"
                    placeholder="you@example.com"
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
                  className="inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-60"
                >
                  {submitting ? 'Checking…' : 'Book now'}
                </button>
                <p className="text-[11px] text-slate-500">
                  No credit card required. You can create your account after this step.
                </p>
              </form>
            </div>
          )}
        </div>

        {/* Right side: simple UI mock / value props */}
        <div className="hidden md:block">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-sky-900/20">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">
                Today&apos;s schedule
              </span>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                Live demo
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">
                    9:00 – 9:30 · New client consult
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Intake completed · Notes pending
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">
                  Confirmed
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">
                    11:00 – 11:45 · Follow-up session
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Intake on file · Report sent
                  </div>
                </div>
                <span className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] text-sky-300">
                  Upcoming
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-dashed border-slate-700 bg-slate-950/40 px-3 py-2">
                <div>
                  <div className="font-medium text-slate-100">
                    Your next booking
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Clients book and complete intake before they arrive.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-800 pt-3">
              <p className="text-[11px] text-slate-400">
                Designed for therapists, coaches, and small practices that want a modern
                experience without enterprise complexity.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Secondary sections */}
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold mb-1">Self-service booking</h3>
          <p className="text-xs text-slate-400">
            Let clients book available time slots without emailing back and forth.
            You control availability and approvals.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold mb-1">Smart intake forms</h3>
          <p className="text-xs text-slate-400">
            Collect context before each session with customizable, JSON-based intake
            forms that flow right into your notes.
          </p>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <h3 className="text-sm font-semibold mb-1">Session summaries</h3>
          <p className="text-xs text-slate-400">
            Keep light-weight documentation attached to each appointment so you can
            see the full story at a glance.
          </p>
        </div>
      </section>
    </div>
  )
}

export default HomePage