"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = void 0;
// src/config/cors.ts
const cors_1 = __importDefault(require("cors"));
const allowedOrigins = [
    'https://clientio.netlify.app', // your Netlify frontend
    'http://localhost:5173', // local dev
];
exports.corsMiddleware = (0, cors_1.default)({
    origin(origin, callback) {
        // Allow non-browser / curl / server-to-server requests (no origin)
        if (!origin) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
});
