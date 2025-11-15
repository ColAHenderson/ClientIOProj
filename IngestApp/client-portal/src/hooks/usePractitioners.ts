// src/hooks/usePractitioners.ts
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface PractitionerSummary {
  id: string
  name: string
  email: string
}

interface UsePractitionersResult {
  practitioners: PractitionerSummary[]
  loading: boolean
  error: string | null
}

export function usePractitioners(): UsePractitionersResult {
  const [practitioners, setPractitioners] = useState<PractitionerSummary[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPractitioners = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `${API_URL}/api/practitioners/public`
        )

        if (!res.ok) {
          throw new Error(`Failed with status ${res.status}`)
        }

        const data = await res.json()
        setPractitioners(data)
      } catch (err: any) {
        console.error('Error fetching practitioners:', err)
        setError(err.message ?? 'Failed to load practitioners')
      } finally {
        setLoading(false)
      }
    }

    fetchPractitioners()
  }, [])

  return { practitioners, loading, error }
}