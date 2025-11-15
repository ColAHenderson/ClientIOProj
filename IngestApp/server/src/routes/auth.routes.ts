/// src/routes/auth.routes.ts
import { Router } from 'express'
import { prisma } from '../prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signAccessToken, signRefreshToken } from '../utils/jwt'
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// Zod schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.enum(['CLIENT', 'PRACTITIONER', 'ADMIN']).optional().default('CLIENT'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// Helper to shape user object for responses (no password hash)
const toUserDto = (user: any) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  role: user.role,
  createdAt: user.createdAt,
})

const checkEmailSchema = z.object({
  email: z.string().email(),
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body as any)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password, firstName, lastName, role } = parsed.data

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      return res.status(409).json({ message: 'Email already in use' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role,
      },
    })

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return res.status(201).json({
      user: toUserDto(user),
      tokens: {
        accessToken,
        refreshToken,
      },
    })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body as any)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
  try {
    const parsed = checkEmailSchema.safeParse(req.body as any)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid email',
        errors: parsed.error.flatten(),
      })
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    return res.json({ exists: !!user })
  } catch (err) {
    console.error('POST /api/auth/check-email error:', err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router