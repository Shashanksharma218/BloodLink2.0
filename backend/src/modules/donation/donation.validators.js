const { z } = require('zod');

const recordDonationSchema = z.object({
  body: z.object({
    pledgeId: z.string().length(24).optional(),
    donorId: z.string().length(24).optional(),
    donationType: z.enum(['WHOLE_BLOOD', 'PLASMA', 'PLATELETS']).default('WHOLE_BLOOD'),
    units: z.number().int().min(1).max(4).default(1),
    donatedAt: z.string().datetime().optional(),
    notes: z.string().trim().max(1000).optional(),
  }).refine((d) => d.pledgeId || d.donorId, {
    message: 'Either pledgeId or donorId must be provided',
  }),
});

const rejectDonationSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    reason: z.string().trim().min(1).max(500),
  }),
});

const idParamSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
});

module.exports = { recordDonationSchema, rejectDonationSchema, idParamSchema };
