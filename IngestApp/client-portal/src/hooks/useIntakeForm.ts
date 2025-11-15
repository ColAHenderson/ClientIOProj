// src/hooks/useIntakeForm.ts
import { useEffect, useState } from 'react'

export type IntakeFieldType = 'text' | 'textarea' | 'number' | 'select' | 'checkbox'

export interface IntakeField {
  id: string
  label: string
  type: IntakeFieldType
  required?: boolean
  placeholder?: string
  options?: string[]
}

export interface IntakeTemplate {
  id: string
  name: string
  description?: string
  fields: IntakeField[]
}

export interface IntakeSubmission {
  id: string
  answers: Record<string, unknown>
  submittedAt: string
}

interface UseIntakeFormResult {
  template: IntakeTemplate | null
  submission: IntakeSubmission | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useIntakeForm(
  appointmentId: string | null,
  token: string | null
): UseIntakeFormResult {
  const [template, setTemplate] = useState<IntakeTemplate | null>(null)
  const [submission, setSubmission] = useState<IntakeSubmission | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshIndex, setRefreshIndex] = useState(0)

  useEffect(() => {
    if (!appointmentId || !token) {
      setTemplate(null)
      setSubmission(null)
      return
    }

    let cancelled = false

    const fetchIntake = async () => {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch(
          `http://localhost:4000/api/intake/appointment/${appointmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        )

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Intake not found for this appointment.')
          }
          if (res.status === 401) {
            throw new Error('Unauthorized. Check your token.')
          }
          if (res.status === 403) {
            throw new Error('You are not allowed to access this appointment.')
          }
          throw new Error(`Request failed with status ${res.status}`)
        }

        const data = await res.json()

        if (cancelled) return

        setTemplate(data.template ?? null)
        setSubmission(data.submission ?? null)
      } catch (err: any) {
        if (cancelled) return
        console.error('Error fetching intake:', err)
        setError(err.message ?? 'Failed to load intake')
        setTemplate(null)
        setSubmission(null)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchIntake()

    return () => {
      cancelled = true
    }
  }, [appointmentId, token, refreshIndex])

  const refetch = () => setRefreshIndex((i) => i + 1)

  return { template, submission, loading, error, refetch }
}