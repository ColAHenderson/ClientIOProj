// src/utils/jwt.ts
import jwt, { type SignOptions } from 'jsonwebtoken'
import { env } from '../config/env'

export type UserRole = 'CLIENT' | 'PRACTITIONER' | 'ADMIN'

export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtAccessExpiresIn as SignOptions['expiresIn'],
  }

  return jwt.sign(payload, env.jwtAccessSecret, options)
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: env.jwtRefreshExpiresIn as SignOptions['expiresIn'],
  }

  return jwt.sign(payload, env.jwtRefreshSecret, options)
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtAccessSecret) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as JwtPayload
}