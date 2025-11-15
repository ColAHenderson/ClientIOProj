// src/utils/jwt.ts
import jwt from 'jsonwebtoken'
import { env } from '../config/env'

export interface JwtPayload {
  userId: string
  role: 'CLIENT' | 'PRACTITIONER' | 'ADMIN'
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(
    payload,
    env.jwtSecret as jwt.Secret,
    {
      // Typescript is overly strict here; runtime is fine with string like "15m"
      expiresIn: env.jwtExpiresIn as unknown as jwt.SignOptions['expiresIn'],
    }
  )
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(
    payload,
    env.jwtSecret as jwt.Secret,
    {
      expiresIn: env.jwtRefreshExpiresIn as unknown as jwt.SignOptions['expiresIn'],
    }
  )
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret as jwt.Secret) as JwtPayload
}