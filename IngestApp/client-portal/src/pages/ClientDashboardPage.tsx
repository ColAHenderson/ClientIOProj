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

interface Practitioner {
  id: string
  name: string
  email: string
}

interface AvailabilitySlot {
  startsAt: string
  endsAt: string
}

const ClientDashboardPage: React.FC = () => {
  const { accessToken, user } = useAuth()

  const [appointments, setAppointments] = useState<AppointmentSummary[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null)

  // NEW: booking-related state
  const [practitioners, setPractitioners] = useState<Practitioner[]>([])
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([])
  const [selectedPractitionerId, setSelectedPractitionerId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  )
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null)
  const [bookingLoading, setBookingLoading] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null)

  // Load existing appointments
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
        const data: AppointmentSummary[] = await res.json()
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
  }, [accessToken, selectedAppointmentId])

  // NEW: load practitioners once we have an access token
  useEffect(() => {
    if (!accessToken) return

    const fetchPractitioners = async () => {
      try {
        setBookingError(null)
        const res = await fetch(`${API_URL}/api/practitioners/public`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        if (!res.ok) {
          throw new Error(`Failed to load practitioners (status ${res.status})`)
        }
        const data: Practitioner[] = await res.json()
        setPractitioners(data)

        // Default to first practitioner if none selected
        if (data.length > 0 && !selectedPractitionerId) {
          setSelectedPractitionerId(data[0].id)
        }
      } catch (err: any) {
        console.error('Error loading practitioners:', err)
        setBookingError(err.message ?? 'Failed to load practitioners')
      }
    }

    fetchPractitioners()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken])

  // NEW: load availability slots when practitioner or date changes
  useEffect(() => {
    if (!accessToken || !selectedPractitionerId || !selectedDate) return

    const fetchSlots = async () => {
      try {
        setBookingError(null)
        setAvailabilitySlots([])
        setSelectedSlotIndex(null)

        const params = new URLSearchParams({
          practitionerId: selectedPractitionerId,
          date: selectedDate,
        })

        const res = await fetch(
          `${API_URL}/api/availability/slots?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        )

        if (!res.ok) {
          throw new Error(`Failed to load availability (status ${res.status})`)
        }

        const data: AvailabilitySlot[] = await res.json()
        setAvailabilitySlots(data)
      } catch (err: any) {
        console.error('Error loading slots:', err)
        setBookingError(err.message ?? 'Failed to load availability')
      }
    }

    fetchSlots()
  }, [accessToken, selectedPractitionerId, selectedDate])

  // NEW: book appointment handler
  const handleBookAppointment = async () => {
    if (!accessToken) {
      setBookingError('You must be logged in to book an appointment.')
      return
    }

    if (!selectedPractitionerId) {
      setBookingError('Please select a practitioner.')
      return
    }

    if (selectedSlotIndex === null || !availabilitySlots[selectedSlotIndex]) {
      setBookingError('Please select a time slot.')
      return
    }

    const slot = availabilitySlots[selectedSlotIndex]

    try {
      setBookingLoading(true)
      setBookingError(null)
      setBookingSuccess(null)

      const res = await fetch(`${API_URL}/api/appointments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          practitionerId: selectedPractitionerId,
          startsAt: slot.startsAt,
          endsAt: slot.endsAt,
        }),
      })

      const text = await res.text()
      let created: any = {}
      if (text) {
        try {
          created = JSON.parse(text)
        } catch (err) {
          console.error('Failed to parse appointment create response:', err, text)
        }
      }

      if (!res.ok) {
        throw new Error(
          created?.message || `Failed to book appointment (status ${res.status})`
        )
      }

      // Assume backend returns the created appointment
      const newAppt: AppointmentSummary = created

      setAppointments((prev) => [...prev, newAppt])
      setSelectedAppointmentId(newAppt.id)
      setBookingSuccess('Appointment booked successfully.')
    } catch (err: any) {
      console.error('Booking error:', err)
      setBookingError(err.message ?? 'Failed to book appointment')
    } finally {
      setBookingLoading(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)]">
      {/* LEFT COLUMN: welcome, booking, appointment list */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-4">
        <div>
          <h1 className="text-xl font-semibold mb-2">
            Welcome{user ? `, ${user.firstName}` : ''} 👋
          </h1>

          <p className="text-sm text-slate-400">
            Here are your upcoming appointments. You can also book a new one and
            then complete or update your intake.
          </p>
        </div>

        {/* NEW: Booking section */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-3">
          <h2 className="text-sm font-semibold text-slate-50">
            Book a new appointment
          </h2>

          {/* Practitioner selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">
              Practitioner
            </label>
            <select
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={selectedPractitionerId}
              onChange={(e) => setSelectedPractitionerId(e.target.value)}
            >
              {practitioners.length === 0 && (
                <option value="">No practitioners available</option>
              )}
              {practitioners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          {/* Date selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">
              Date
            </label>
            <input
              type="date"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          {/* Time slot selection */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300">
              Available time slots
            </label>
            {availabilitySlots.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                No available slots for this practitioner on this date.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {availabilitySlots.map((slot, idx) => {
                  const start = new Date(slot.startsAt)
                  const end = new Date(slot.endsAt)
                  const isSelected = idx === selectedSlotIndex

                  return (
                    <button
                      key={`${slot.startsAt}-${slot.endsAt}-${idx}`}
                      type="button"
                      onClick={() => setSelectedSlotIndex(idx)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        isSelected
                          ? 'border-sky-500 bg-sky-500/20 text-sky-100'
                          : 'border-slate-700 bg-slate-900/60 text-slate-200 hover:border-sky-500'
                      }`}
                    >
                      {start.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      –{' '}
                      {end.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Booking error / success */}
          {bookingError && (
            <p className="text-[11px] text-red-400">{bookingError}</p>
          )}
          {bookingSuccess && (
            <p className="text-[11px] text-emerald-400">{bookingSuccess}</p>
          )}

          <button
            type="button"
            disabled={bookingLoading || availabilitySlots.length === 0}
            onClick={handleBookAppointment}
            className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 disabled:opacity-60"
          >
            {bookingLoading ? 'Booking…' : 'Book appointment'}
          </button>
        </div>

        {/* Existing appointments list */}
        <div>
          <h2 className="text-sm font-semibold mb-2 text-slate-50">
            Your appointments
          </h2>

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
            <ul className="space-y-2 text-sm mt-2">
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
      </div>

      {/* RIGHT COLUMN: intake form panel */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="text-sm font-semibold mb-2">Intake form</h2>
        <IntakeFormPanel appointmentId={selectedAppointmentId} />
      </div>
    </div>
  )
}

export default ClientDashboardPage