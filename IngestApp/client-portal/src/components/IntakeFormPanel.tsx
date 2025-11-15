// src/components/IntakeFormPanel.tsx
import React, { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { useIntakeForm } from '../hooks/useIntakeForm'
import type { IntakeField } from '../hooks/useIntakeForm'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'


interface Props {
  appointmentId: string | null
}

const IntakeFormPanel: React.FC<Props> = ({ appointmentId }) => {
  const { accessToken, user } = useAuth()
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)

  const {
    template,
    submission,
    loading,
    error,
    refetch,
  } = useIntakeForm(appointmentId, accessToken)

  const [answers, setAnswers] = useState<Record<string, any>>({})

  useEffect(() => {
    if (!template) {
      setAnswers({})
      return
    }
    const initial: Record<string, any> = {}
    for (const field of template.fields) {
      if (submission && submission.answers[field.id] !== undefined) {
        initial[field.id] = submission.answers[field.id]
      } else if (field.type === 'checkbox') {
        initial[field.id] = false
      } else {
        initial[field.id] = ''
      }
    }
    setAnswers(initial)
  }, [template, submission])

  const handleChange = (field: IntakeField, value: any) => {
    setAnswers((prev) => ({ ...prev, [field.id]: value }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitStatus(null)

    if (!template || !appointmentId || !accessToken) {
      setSubmitStatus('Missing template, appointment id, or auth.')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/intake/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          appointmentId,
          templateId: template.id,
          answers,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('Intake submit error:', body)
        throw new Error(body.message ?? `Failed with status ${res.status}`)
      }

      setSubmitStatus('Intake submitted successfully.')
      refetch()
    } catch (err: any) {
      setSubmitStatus(err.message ?? 'Failed to submit intake.')
    }
  }

  if (!appointmentId) {
    return (
      <p className="text-xs text-slate-400">
        Select an appointment to view or complete intake.
      </p>
    )
  }

  if (!user) {
    return (
      <p className="text-xs text-slate-400">
        Login required to view intake.
      </p>
    )
  }

  if (loading) {
    return <p className="text-xs text-slate-400">Loading intake…</p>
  }

  if (error) {
    return (
      <p className="text-xs text-red-400">
        Failed to load intake: {error}
      </p>
    )
  }

  if (!template) {
    return (
      <p className="text-xs text-slate-400">
        No active intake template available.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{template.name}</h3>
        {template.description && (
          <p className="text-xs text-slate-400">{template.description}</p>
        )}
        {submission && (
          <p className="mt-1 text-[11px] text-slate-500">
            Last submitted:{' '}
            {new Date(submission.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {template.fields.map((field) => {
          const value = answers[field.id]

          return (
            <div key={field.id} className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-200">
                {field.label}
                {field.required && (
                  <span className="ml-1 text-red-400">*</span>
                )}
              </label>

              {field.type === 'text' && (
                <input
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  placeholder={field.placeholder}
                  value={value ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  className="min-h-[80px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  placeholder={field.placeholder}
                  value={value ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                />
              )}

              {field.type === 'number' && (
                <input
                  type="number"
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  placeholder={field.placeholder}
                  value={value ?? ''}
                  onChange={(e) =>
                    handleChange(
                      field,
                      e.target.value === '' ? '' : Number(e.target.value)
                    )
                  }
                />
              )}

              {field.type === 'select' && (
                <select
                  className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-sky-500"
                  value={value ?? ''}
                  onChange={(e) => handleChange(field, e.target.value)}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'checkbox' && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!value}
                    onChange={(e) => handleChange(field, e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-sky-500"
                  />
                  <span className="text-xs text-slate-300">
                    {field.placeholder ?? 'Check to agree'}
                  </span>
                </div>
              )}
            </div>
          )
        })}

        <div className="pt-2 flex flex-col gap-1">
          <button
            type="submit"
            className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400"
          >
            Submit intake
          </button>
          {submitStatus && (
            <p className="text-xs text-slate-300">{submitStatus}</p>
          )}
        </div>
      </form>
    </div>
  )
}

export default IntakeFormPanel