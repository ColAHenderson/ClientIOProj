// src/routes/user.routes.ts
import { Router } from 'express'
import { prisma } from '../prisma'
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// GET /api/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    })

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    })
  } catch (err) {
    console.error('/api/me error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// Public list of practitioners for booking UI
// GET /api/practitioners/public
router.get('/practitioners/public', async (_req, res) => {
  try {
    const practitioners = await prisma.user.findMany({
      where: { role: 'PRACTITIONER' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: {
        firstName: 'asc',
      },
    })

    const result = practitioners.map((p) => ({
      id: p.id,
      name: `${p.firstName} ${p.lastName}`,
      email: p.email,
    }))

    return res.json(result)
  } catch (err) {
    console.error('GET /api/practitioners/public error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router