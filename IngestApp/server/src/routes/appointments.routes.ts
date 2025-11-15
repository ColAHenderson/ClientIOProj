// src/routes/appointments.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// DTO helper
const mapAppointment = (appt: any) => ({
  id: appt.id,
  startsAt: appt.startsAt,
  endsAt: appt.endsAt,
  status: appt.status,
  client: appt.client
    ? {
        id: appt.client.id,
        name: `${appt.client.firstName} ${appt.client.lastName}`,
        email: appt.client.email,
      }
    : null,
  practitioner: appt.practitioner
    ? {
        id: appt.practitioner.id,
        name: `${appt.practitioner.firstName} ${appt.practitioner.lastName}`,
        email: appt.practitioner.email,
      }
    : null,
})

// 🔓 Public demo endpoint – simple list of upcoming appointments
// GET /api/appointments/public
router.get('/public', async (_req, res) => {
  try {
    const now = new Date()

    const appts = await prisma.appointment.findMany({
      where: {
        startsAt: {
          gte: now,
        },
      },
      include: {
        client: true,
        practitioner: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
      take: 10,
    })

    return res.json(appts.map(mapAppointment))
  } catch (err) {
    console.error('GET /api/appointments/public error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// 🛡️ Protected: get appointments for current user
// GET /api/appointments
router.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { userId, role } = req.user

    let whereClause: any = {}

    if (role === 'CLIENT') {
      whereClause = { clientId: userId }
    } else if (role === 'PRACTITIONER') {
      whereClause = { practitionerId: userId }
    } else if (role === 'ADMIN') {
      // Admin sees all appointments
      whereClause = {}
    }

    const appts = await prisma.appointment.findMany({
      where: whereClause,
      include: {
        client: true,
        practitioner: true,
      },
      orderBy: {
        startsAt: 'asc',
      },
    })

    return res.json(appts.map(mapAppointment))
  } catch (err: any) {
    console.error('POST /api/appointments error:', err)

    if (err.code === 'P2003') {
        // Foreign key constraint (invalid clientId or practitionerId)
        return res.status(400).json({
        message: 'Invalid clientId or practitionerId: user does not exist',
        })
    }

    return res.status(500).json({ message: 'Internal server error' })
    }
})

// 🛡️ Protected: create an appointment
// POST /api/appointments
const createAppointmentSchema = z.object({
  clientId: z.string().optional(), // optional: filled automatically for CLIENT
  practitionerId: z.string().min(1),
  startsAt: z.string().min(1),
  endsAt: z.string().min(1),
})

// POST /api/appointments
router.post('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { userId, role } = req.user

    const parsed = createAppointmentSchema.safeParse(req.body as any)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid appointment data',
        errors: parsed.error.flatten(),
      })
    }

    let { clientId, practitionerId, startsAt, endsAt } = parsed.data

    // Role-based behavior:
    if (role === 'CLIENT') {
      // Client always books for themselves
      clientId = userId
    } else if (role === 'PRACTITIONER' || role === 'ADMIN') {
      // These roles must provide clientId explicitly
      if (!clientId) {
        return res.status(400).json({
          message: 'clientId is required when creating an appointment as practitioner/admin',
        })
      }
    } else {
      return res.status(403).json({ message: 'Not allowed to create appointments' })
    }

    if (!clientId) {
      return res.status(400).json({ message: 'clientId could not be resolved' })
    }

    const start = new Date(startsAt)
    const end = new Date(endsAt)

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid date format' })
    }

    if (end <= start) {
      return res.status(400).json({ message: 'end time must be after start time' })
    }

    // Ensure practitioner exists and is actually a practitioner
    const practitioner = await prisma.user.findUnique({
      where: { id: practitionerId },
    })

    if (!practitioner || practitioner.role !== 'PRACTITIONER') {
      return res.status(400).json({ message: 'Invalid practitionerId' })
    }

    // Optional: ensure client exists
    const client = await prisma.user.findUnique({
      where: { id: clientId },
    })

    if (!client) {
      return res.status(400).json({ message: 'Invalid clientId' })
    }

    // Check for overlapping appointments for this practitioner
    const overlapping = await prisma.appointment.findFirst({
      where: {
        practitionerId,
        startsAt: { lt: end },
        endsAt: { gt: start },
        NOT: { status: 'CANCELLED' },
      },
    })

    if (overlapping) {
      return res.status(409).json({
        message: 'This time slot is no longer available.',
      })
    }

    const appt = await prisma.appointment.create({
      data: {
        clientId,
        practitionerId,
        startsAt: start,
        endsAt: end,
        status: 'PENDING',
      },
      include: {
        client: true,
        practitioner: true,
      },
    })

    return res.status(201).json(appt)
  } catch (err) {
    console.error('POST /api/appointments error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router