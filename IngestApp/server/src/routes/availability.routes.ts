// src/routes/availability.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'

const router = Router()

// Query validation
const availabilityQuerySchema = z.object({
  practitionerId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format'),
})

/**
 * Helper: generate 30-minute slots between 09:00 and 17:00 local time
 */
function generateSlotsForDate(date: Date, slotMinutes = 30) {
  const slots: { start: Date; end: Date }[] = []

  const startOfDay = new Date(date)
  startOfDay.setHours(9, 0, 0, 0) // 09:00

  const endOfDay = new Date(date)
  endOfDay.setHours(17, 0, 0, 0) // 17:00

  const current = new Date(startOfDay)

  while (current < endOfDay) {
    const slotStart = new Date(current)
    const slotEnd = new Date(current.getTime() + slotMinutes * 60_000)

    if (slotEnd <= endOfDay) {
      slots.push({ start: slotStart, end: slotEnd })
    }

    current.setTime(current.getTime() + slotMinutes * 60_000)
  }

  return slots
}

/**
 * GET /api/availability
 * Query params:
 *  - practitionerId: string
 *  - date: YYYY-MM-DD (local date)
 */
router.get('/', async (req, res) => {
  try {
    const parsed = availabilityQuerySchema.safeParse(req.query as any)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid query params',
        errors: parsed.error.flatten(),
      })
    }

    const { practitionerId, date } = parsed.data

    // Build the day's date range in local time
    const [year, month, day] = date.split('-').map((x) => Number(x))
    const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0)
    const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999)

    // Get existing appointments that might block slots
    const appointments = await prisma.appointment.findMany({
      where: {
        practitionerId,
        // Only appointments on that date
        startsAt: {
          gte: dayStart,
          lte: dayEnd,
        },
        // Ignore cancelled ones
        NOT: {
          status: 'CANCELLED',
        },
      },
    })

    const allSlots = generateSlotsForDate(dayStart)

    const isOverlapping = (
      slotStart: Date,
      slotEnd: Date,
      apptStart: Date,
      apptEnd: Date
    ) => {
      return slotStart < apptEnd && slotEnd > apptStart
    }

    const availableSlots = allSlots.filter((slot) => {
      return !appointments.some((appt) =>
        isOverlapping(
          slot.start,
          slot.end,
          appt.startsAt,
          appt.endsAt
        )
      )
    })

    return res.json(
      availableSlots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      }))
    )
  } catch (err) {
    console.error('GET /api/availability error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router