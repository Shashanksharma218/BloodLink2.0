const { z } = require('zod');

const createPledgeSchema = z.object({
  params: z.object({ id: z.string().length(24, 'Invalid request ID') }),
});

const cancelPledgeSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    category: z.enum(['SCHEDULE_CONFLICT', 'HEALTH', 'DISTANCE', 'REQUEST_FULFILLED', 'OTHER']),
    note: z.string().trim().max(500).optional(),
  }),
});

module.exports = { createPledgeSchema, cancelPledgeSchema };
