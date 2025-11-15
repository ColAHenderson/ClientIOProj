"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/routes/availability.routes.ts
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../prisma");
const router = (0, express_1.Router)();
// Query validation
const availabilityQuerySchema = zod_1.z.object({
    practitionerId: zod_1.z.string().min(1),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected date in YYYY-MM-DD format'),
});
/**
 * Helper: generate 30-minute slots between 09:00 and 17:00 local time
 */
function generateSlotsForDate(date, slotMinutes = 30) {
    const slots = [];
    const startOfDay = new Date(date);
    startOfDay.setHours(9, 0, 0, 0); // 09:00
    const endOfDay = new Date(date);
    endOfDay.setHours(17, 0, 0, 0); // 17:00
    const current = new Date(startOfDay);
    while (current < endOfDay) {
        const slotStart = new Date(current);
        const slotEnd = new Date(current.getTime() + slotMinutes * 60000);
        if (slotEnd <= endOfDay) {
            slots.push({ start: slotStart, end: slotEnd });
        }
        current.setTime(current.getTime() + slotMinutes * 60000);
    }
    return slots;
}
/**
 * GET /api/availability
 * Query params:
 *  - practitionerId: string
 *  - date: YYYY-MM-DD (local date)
 */
router.get('/', async (req, res) => {
    try {
        const parsed = availabilityQuerySchema.safeParse(req.query);
        if (!parsed.success) {
            return res.status(400).json({
                message: 'Invalid query params',
                errors: parsed.error.flatten(),
            });
        }
        const { practitionerId, date } = parsed.data;
        // Build the day's date range in local time
        const [year, month, day] = date.split('-').map((x) => Number(x));
        const dayStart = new Date(year, month - 1, day, 0, 0, 0, 0);
        const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);
        // Get existing appointments that might block slots
        const appointments = await prisma_1.prisma.appointment.findMany({
            where: {
                practitionerId,
                // Only appointments on that date
                startsAt: {
                    gte: dayStart,
                    lte: dayEnd,
                },
                // Ignore cancelled ones
                NOT: {
                    status: 'CANCELLED',
                },
            },
        });
        const allSlots = generateSlotsForDate(dayStart);
        const isOverlapping = (slotStart, slotEnd, apptStart, apptEnd) => {
            return slotStart < apptEnd && slotEnd > apptStart;
        };
        const availableSlots = allSlots.filter((slot) => {
            return !appointments.some((appt) => isOverlapping(slot.start, slot.end, appt.startsAt, appt.endsAt));
        });
        return res.json(availableSlots.map((slot) => ({
            start: slot.start.toISOString(),
            end: slot.end.toISOString(),
        })));
    }
    catch (err) {
        console.error('GET /api/availability error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
exports.default = router;
