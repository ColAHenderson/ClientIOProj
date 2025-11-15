// src/pages/ClientDashboardPage.tsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import IntakeFormPanel from '../components/IntakeFormPanel'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'


interface AppointmentSummary {
  id: string
  startsAt: string
  endsAt: string
  status: string
  practitioner: {
    id: string
    name: string
    email: string
  } | null
}

const ClientDashboardPage: React.FC = () => {
  const { accessToken, user } = useAuth()
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  useEffect(() => {
    if (!accessToken) return

    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`${API_URL}/api/appointments`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`)
        }
        const data = await res.json()
        setAppointments(data)
        if (data.length > 0 && !selectedAppointmentId) {
          setSelectedAppointmentId(data[0].id)
        }
      } catch (err: any) {
        setError(err.message ?? 'Failed to load appointments')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [accessToken])

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h1 className="text-xl font-semibold mb-2">
          Welcome{user ? `, ${user.firstName}` : ''} 👋
        </h1>
        <p className="text-sm text-slate-400 mb-4">
          Here are your upcoming appointments. Select one to complete or update your intake.
        </p>

        {loading && (
          <p className="text-xs text-slate-400">Loading appointments…</p>
        )}

        {error && (
          <p className="text-xs text-red-400">
            {error}
          </p>
        )}

        {!loading && !error && appointments.length === 0 && (
          <p className="text-xs text-slate-400">
            You don&apos;t have any appointments yet.
          </p>
        )}

        {!loading && !error && appointments.length > 0 && (
          <ul className="space-y-2 text-sm">
            {appointments.map((appt) => {
              const start = new Date(appt.startsAt)
              const end = new Date(appt.endsAt)
              const isActive = appt.id === selectedAppointmentId

              return (
                <li key={appt.id}>
                  <button
                    onClick={() => setSelectedAppointmentId(appt.id)}
                    className={`w-full text-left rounded-lg border px-3 py-2 ${
                      isActive
                        ? 'border-sky-500 bg-slate-900'
                        : 'border-slate-800 bg-slate-900/70 hover:border-sky-500'
                    }`}
                  >
                    <div className="font-medium">
                      {start.toLocaleDateString()} ·{' '}
                      {start.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      –{' '}
                      {end.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Practitioner:{' '}
                      {appt.practitioner
                        ? appt.practitioner.name
                        : 'Unassigned'}{' '}
                      · Status: {appt.status}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold mb-2">Intake form</h2>
        <IntakeFormPanel appointmentId={selectedAppointmentId} />
      </div>
    </div>
  )
}

export default ClientDashboardPage