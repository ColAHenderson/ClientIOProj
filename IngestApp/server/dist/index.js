"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const cors_1 = require("./config/cors");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const appointments_routes_1 = __importDefault(require("./routes/appointments.routes"));
const availability_routes_1 = __importDefault(require("./routes/availability.routes"));
const intake_routes_1 = __importDefault(require("./routes/intake.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
// Middlewares
app.use(cors_1.corsMiddleware);
app.use(express_1.default.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        environment: env_1.env.nodeEnv,
        timestamp: new Date().toISOString(),
    });
});
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api', user_routes_1.default); // /api/me
app.use('/api/appointments', appointments_routes_1.default); // /api/appointments & /api/appointments/public
app.use('/api/availability', availability_routes_1.default); // /api/availability
app.use('/api/intake', intake_routes_1.default);
// 404 fallback
app.use((_req, res) => {
    res.status(404).json({ message: 'Not found' });
});
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
