// src/routes/auth.routes.ts
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../prisma'
import {
  signAccessToken,
  signRefreshToken,
  type JwtPayload,
} from '../utils/jwt'
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth'

const router = Router()

// ---------- Schemas ----------
const CheckEmailSchema = z.object({
  email: z.string().email(),
})

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
})

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// ---------- Routes ----------

// POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
  try {
    const { email } = CheckEmailSchema.parse(req.body)

    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    })

    return res.json({ exists: !!existing })
  } catch (err) {
    console.error('check-email error:', err)
    return res.status(400).json({ message: 'Invalid request' })
  }
})

// Optional GET /api/auth/check-email?email=...
router.get('/check-email', async (req, res) => {
  try {
    const email = String(req.query.email ?? '')
    const { email: parsedEmail } = CheckEmailSchema.parse({ email })

    const existing = await prisma.user.findUnique({
      where: { email: parsedEmail },
      select: { id: true },
    })

    return res.json({ exists: !!existing })
  } catch (err) {
    console.error('check-email (GET) error:', err)
    return res.status(400).json({ message: 'Invalid request' })
  }
})

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = RegisterSchema.parse(
      req.body
    )

    const existing = await prisma.user.findUnique({ where: { email } })
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
        role: 'CLIENT', // adjust if your Role enum uses different values
      },
    })

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
    }

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('register error:', err)
    return res.status(400).json({ message: 'Invalid request' })
  }
})

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = LoginSchema.parse(req.body)

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
    }

    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('login error:', err)
    return res.status(400).json({ message: 'Invalid request' })
  }
})

// GET /api/auth/me
router.get('/me', authMiddleware, async (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
    },
  })

  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }

  return res.json({ user })
})

export default router