// src/config/cors.ts
import cors from 'cors'

const allowedOrigins = [
  'https://clientio.netlify.app', // your Netlify frontend
  'http://localhost:5173',        // local dev
]

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow non-browser / curl / server-to-server requests (no origin)
    if (!origin) {
      return callback(null, true)
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})