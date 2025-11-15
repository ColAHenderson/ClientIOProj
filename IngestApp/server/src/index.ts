// src/index.ts
import express from 'express'
import { env } from './config/env'
import { corsMiddleware } from './config/cors'
import authRoutes from './routes/auth.routes'
import userRoutes from './routes/user.routes'
import appointmentRoutes from './routes/appointments.routes'
import availabilityRoutes from './routes/availability.routes'
import intakeRoutes from './routes/intake.routes'
import cors from 'cors'

const app = express()

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000

const allowedOrigins = [
  'http://localhost:5173',
  'https://clientioproj.onrender.com/', // your production frontend
]

// Middlewares
app.use(corsMiddleware)
app.use(express.json())

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  })
})

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    },
    credentials: false,
  })
)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api', userRoutes) // /api/me
app.use('/api/appointments', appointmentRoutes) // /api/appointments & /api/appointments/public
app.use('/api/availability', availabilityRoutes) // /api/availability
app.use('/api/intake', intakeRoutes)

// 404 fallback
app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})