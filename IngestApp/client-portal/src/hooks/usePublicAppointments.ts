// src/hooks/usePublicAppointments.ts
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'


export interface PublicAppointment {
  id: string
  startsAt: string
  endsAt: string
  status: string
  client: {
    id: string
    name: string
    email: string
  } | null
  practitioner: {
    id: string
    name: string
    email: string
  } | null
}

interface UsePublicAppointmentsResult {
  appointments: PublicAppointment[]
  loading: boolean
  error: string | null
}

export function usePublicAppointments(): UsePublicAppointmentsResult {
  const [appointments, setAppointments] = useState<PublicAppointment[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(`${API_URL}/api/appointments/public`)

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }

        const data = await res.json()
        setAppointments(data)
      } catch (err: any) {
        console.error('Error fetching public appointments:', err)
        setError(err.message ?? 'Failed to load appointments')
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [])

  return { appointments, loading, error }
}