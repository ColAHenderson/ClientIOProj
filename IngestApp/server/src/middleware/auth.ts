// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from '../utils/jwt'

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyToken(token)
    req.user = payload
    next()
  } catch (err) {
    console.error('JWT verification error:', err)
    return res.status(401).json({ message: 'Invalid or expired token' })
  }
}