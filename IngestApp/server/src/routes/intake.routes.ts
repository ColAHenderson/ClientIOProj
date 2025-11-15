// src/routes/intake.routes.ts
import { Router } from 'express'
import { z } from 'zod'
import { prisma } from '../prisma'
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// ---------- Types / Schemas ----------

const fieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['text', 'textarea', 'number', 'select', 'checkbox']),
  required: z.boolean().optional().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(), // for selects
})

const createTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  fields: z.array(fieldSchema).min(1),
})

const submitIntakeSchema = z.object({
  appointmentId: z.string().min(1),
  templateId: z.string().min(1),
  // keys are field ids (strings), values can be anything (string/number/boolean/etc.)
  answers: z.record(z.string(), z.unknown()),
})

// ---------- Helpers ----------

const parseFieldsJson = (fieldsJson: string) => {
  try {
    const parsed = JSON.parse(fieldsJson)
    return z.array(fieldSchema).parse(parsed)
  } catch (err) {
    console.error('Failed to parse fieldsJson:', err)
    return []
  }
}

// ---------- Routes ----------

// POST /api/intake/templates
// For now: allow PRACTITIONER or ADMIN to create templates
router.post('/templates', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { role } = req.user
    if (role === 'CLIENT') {
      return res.status(403).json({ message: 'Clients cannot create templates' })
    }

    const parsed = createTemplateSchema.safeParse(req.body as any)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid template input',
        errors: parsed.error.flatten(),
      })
    }

    const { name, description, isActive, fields } = parsed.data

    const template = await prisma.intakeFormTemplate.create({
      data: {
        name,
        description,
        isActive,
        fieldsJson: JSON.stringify(fields),
      },
    })

    return res.status(201).json({
      id: template.id,
      name: template.name,
      description: template.description,
      isActive: template.isActive,
      fields,
      createdAt: template.createdAt,
    })
  } catch (err) {
    console.error('POST /api/intake/templates error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/intake/templates/active
router.get('/templates/active', async (_req, res) => {
  try {
    const templates = await prisma.intakeFormTemplate.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    })

    const response = templates.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      isActive: t.isActive,
      fields: parseFieldsJson(t.fieldsJson),
      createdAt: t.createdAt,
    }))

    return res.json(response)
  } catch (err) {
    console.error('GET /api/intake/templates/active error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/intake/appointment/:appointmentId
// Returns: { template, submission } for the logged-in user
router.get(
  '/appointment/:appointmentId',
  authMiddleware,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' })
      }

      const { userId, role } = req.user
      const { appointmentId } = req.params as any

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          client: true,
          practitioner: true,
          intakeSubmissions: true,
        },
      })

      if (!appointment) {
        return res.status(404).json({ message: 'Appointment not found' })
      }

      // Authorization
      if (role === 'CLIENT') {
        if (appointment.clientId !== userId) {
          return res.status(403).json({ message: 'Not allowed to access this appointment' })
        }
      } else if (role === 'PRACTITIONER') {
        if (appointment.practitionerId !== userId) {
          return res.status(403).json({ message: 'Not allowed to access this appointment' })
        }
      } // ADMIN can see anything

      // choose template
      const template = await prisma.intakeFormTemplate.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
      })

      if (!template) {
        return res.status(404).json({ message: 'No active intake template found' })
      }

      // pick submission relevant to this appointment (only one client per appointment)
      const existing = appointment.intakeSubmissions[0] ?? null

      return res.json({
        template: {
          id: template.id,
          name: template.name,
          description: template.description,
          fields: parseFieldsJson(template.fieldsJson),
        },
        submission: existing
          ? {
            id: existing.id,
            answers: (() => {
              try {
                return JSON.parse(existing.answersJson)
              } catch {
                return {}
              }
            })(),
            submittedAt: existing.submittedAt,
            client: appointment.client
              ? {
                id: appointment.client.id,
                name: `${appointment.client.firstName} ${appointment.client.lastName}`,
                email: appointment.client.email,
              }
              : null,
          }
          : null,
      })
    } catch (err) {
      console.error('GET /api/intake/appointment/:appointmentId error:', err)
      return res.status(500).json({ message: 'Internal server error' })
    }
})

// POST /api/intake/submit
router.post('/submit', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const { userId, role } = req.user

    const parsed = submitIntakeSchema.safeParse(req.body as any)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid submission input',
        errors: parsed.error.flatten(),
      })
    }

    const { appointmentId, templateId, answers } = parsed.data

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
    })

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' })
    }

    // For now: only the CLIENT of the appointment can submit
    if (role === 'CLIENT' && appointment.clientId !== userId) {
      return res
        .status(403)
        .json({ message: 'You are not the client for this appointment' })
    }

    const answersJson = JSON.stringify(answers)

    const submission = await prisma.intakeSubmission.upsert({
      where: {
        appointmentId_clientId: {
          appointmentId,
          clientId: userId,
        },
      },
      create: {
        appointmentId,
        clientId: userId,
        templateId,
        answersJson,
      },
      update: {
        templateId,
        answersJson,
        submittedAt: new Date(),
      },
    })

    return res.status(201).json({
      id: submission.id,
      appointmentId: submission.appointmentId,
      templateId: submission.templateId,
      answers,
      submittedAt: submission.submittedAt,
    })
  } catch (err) {
    console.error('POST /api/intake/submit error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router