"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// src/routes/auth.routes.ts
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../prisma");
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
// Zod schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters'),
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    role: zod_1.z.enum(['CLIENT', 'PRACTITIONER', 'ADMIN']).optional().default('CLIENT'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1),
});
// Helper to shape user object for responses (no password hash)
const toUserDto = (user) => ({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    createdAt: user.createdAt,
});
const checkEmailSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
});
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Invalid input',
                errors: parsed.error.flatten(),
            });
        }
        const { email, password, firstName, lastName, role } = parsed.data;
        const existing = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await prisma_1.prisma.user.create({
            data: {
                email,
                passwordHash,
                firstName,
                lastName,
                role,
            },
        });
        const payload = { userId: user.id, role: user.role };
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        const refreshToken = (0, jwt_1.signRefreshToken)(payload);
        return res.status(201).json({
            user: toUserDto(user),
            tokens: {
                accessToken,
                refreshToken,
            },
        });
    }
    catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Invalid input',
                errors: parsed.error.flatten(),
            });
        }
        const { email, password } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const valid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }
        const payload = { userId: user.id, role: user.role };
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        const refreshToken = (0, jwt_1.signRefreshToken)(payload);
        return res.json({
            user: toUserDto(user),
            tokens: {
                accessToken,
                refreshToken,
            },
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
    try {
        const parsed = checkEmailSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Invalid email',
                errors: parsed.error.flatten(),
            });
        }
        const { email } = parsed.data;
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            select: { id: true },
        });
        return res.json({ exists: !!user });
    }
    catch (err) {
        console.error('POST /api/auth/check-email error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
