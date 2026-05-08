const { z } = require('zod');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const createRequestSchema = z.object({
  body: z.object({
    hospitalId: z.string().length(24, 'Invalid hospital ID'),
    patientName: z.string().trim().min(1).max(100),
    patientAge: z.number().int().min(0).max(130),
    patientGender: z.enum(['M', 'F', 'OTHER']),
    bloodGroup: z.enum(BLOOD_GROUPS),
    unitsRequired: z.number().int().min(1).max(20),
    urgency: z.enum(['CRITICAL', 'HIGH', 'NORMAL']),
    requiredBy: z.string().datetime({ message: 'requiredBy must be a valid ISO date' }),
    patientContact: z.object({
      name: z.string().trim().min(1),
      phone: z.string().trim().min(10),
      relationship: z.string().trim().min(1),
    }),
    notes: z.string().trim().max(1000).optional(),
  }).refine((d) => {
    const dt = new Date(d.requiredBy);
    const oneHourFromNow = new Date(Date.now() + 60 * 60 * 1000);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    return dt >= oneHourFromNow && dt <= thirtyDaysFromNow;
  }, { message: 'requiredBy must be between 1 hour and 30 days from now', path: ['requiredBy'] }),
});

const cancelRequestSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    reason: z.string().trim().min(1).max(500),
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
});

module.exports = { createRequestSchema, cancelRequestSchema, idParamSchema };
