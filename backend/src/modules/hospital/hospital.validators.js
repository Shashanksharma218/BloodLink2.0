const { z } = require('zod');

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(200).optional(),
    phone: z.string().trim().min(10).optional(),
    address: z.string().trim().max(500).optional(),
  }),
});

const verifyRequestSchema = z.object({
  params: z.object({ id: z.string().length(24, 'Invalid request ID') }),
});

const rejectRequestSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    category: z.enum(['INVALID_PROOF', 'DUPLICATE', 'UNREACHABLE', 'OTHER']),
    reason: z.string().trim().min(1).max(500),
  }),
});

const noShowSchema = z.object({
  params: z.object({ id: z.string().length(24) }),
  body: z.object({
    note: z.string().trim().max(500).optional(),
  }),
});

module.exports = { updateProfileSchema, verifyRequestSchema, rejectRequestSchema, noShowSchema };
