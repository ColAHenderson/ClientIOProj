// src/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

type UserRole = 'CLIENT' | 'PRACTITIONER' | 'ADMIN'

interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader =
    (req.headers['authorization'] as string | undefined) ??
    (req.headers['Authorization'] as string | undefined)

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json({ message: 'Missing or invalid authorization header' })
  }

  const token = authHeader.substring('Bearer '.length)

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret) as JwtPayload

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (err) {
    console.error('authMiddleware error verifying token:', err)
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}