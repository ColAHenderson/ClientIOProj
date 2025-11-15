// src/hooks/useAvailability.ts
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'


export interface AvailabilitySlot {
  start: string
  end: string
}

interface UseAvailabilityArgs {
  practitionerId: string | null
  date: string | null // YYYY-MM-DD
  refreshKey?: number
}

interface UseAvailabilityResult {
  slots: AvailabilitySlot[]
  loading: boolean
  error: string | null
}

export function useAvailability(
  args: UseAvailabilityArgs
): UseAvailabilityResult {
  const { practitionerId, date, refreshKey = 0 } = args

  const [slots, setSlots] = useState<AvailabilitySlot[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!practitionerId || !date) {
      setSlots([])
      return
    }

    const fetchSlots = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          practitionerId,
          date,
        })

        const res = await fetch(
          `${API_URL}/api/availability?${params.toString()}`
        )

        if (!res.ok) {
          throw new Error(`Request failed with status ${res.status}`)
        }

        const data = await res.json()
        setSlots(data)
      } catch (err: any) {
        console.error('Error fetching availability:', err)
        setError(err.message ?? 'Failed to load availability')
        setSlots([])
      } finally {
        setLoading(false)
      }
    }

    fetchSlots()
  }, [practitionerId, date, refreshKey])

  return { slots, loading, error }
}