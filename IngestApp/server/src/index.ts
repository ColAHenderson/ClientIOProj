// src/index.ts
import 'dotenv/config'
import express from 'express'
import { corsMiddleware } from './config/cors'

import authRoutes from './routes/auth.routes'
import appointmentRoutes from './routes/appointments.routes'
import availabilityRoutes from './routes/availability.routes'
import intakeRoutes from './routes/intake.routes'
import userRoutes from './routes/user.routes'

const app = express()

// CORS + JSON
app.use(corsMiddleware)
app.use(express.json())

// Simple health check
app.get('/', (_req, res) => {
  res.json({ message: 'API is running' })
})

// ✅ Mount routers with these base paths
app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/availability', availabilityRoutes)
app.use('/api/intake', intakeRoutes)
app.use('/api/users', userRoutes)

const PORT = Number(process.env.PORT ?? 4000)

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`)
})