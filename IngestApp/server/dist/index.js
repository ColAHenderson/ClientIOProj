"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = require("./config/cors");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const appointments_routes_1 = __importDefault(require("./routes/appointments.routes"));
const availability_routes_1 = __importDefault(require("./routes/availability.routes"));
const intake_routes_1 = __importDefault(require("./routes/intake.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const app = (0, express_1.default)();
app.use(cors_1.corsMiddleware);
// (optional but nice to handle preflight explicitly)
app.options('*', cors_1.corsMiddleware);
app.use(express_1.default.json());
// health check
app.get('/', (_req, res) => {
    res.json({ message: 'API is running' });
});
//routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/appointments', appointments_routes_1.default);
app.use('/api/availability', availability_routes_1.default);
app.use('/api/intake', intake_routes_1.default);
app.use('/api/users', user_routes_1.default);
const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});
