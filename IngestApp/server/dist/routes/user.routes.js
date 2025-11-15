"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/user.routes.ts
const express_1 = require("express");
const prisma_1 = require("../prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET /api/me
router.get('/me', auth_1.authMiddleware, async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            createdAt: user.createdAt,
        });
    }
    catch (err) {
        console.error('/api/me error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
// Public list of practitioners for booking UI
// GET /api/practitioners/public
router.get('/practitioners/public', async (_req, res) => {
    try {
        const practitioners = await prisma_1.prisma.user.findMany({
            where: { role: 'PRACTITIONER' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
            },
            orderBy: {
                firstName: 'asc',
            },
        });
        const result = practitioners.map((p) => ({
            id: p.id,
            name: `${p.firstName} ${p.lastName}`,
            email: p.email,
        }));
        return res.json(result);
    }
    catch (err) {
        console.error('GET /api/practitioners/public error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
