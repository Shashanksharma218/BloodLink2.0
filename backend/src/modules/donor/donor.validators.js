const { z } = require('zod');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(100).optional(),
    phone: z.string().trim().min(10).optional(),
    pincode: z.string().regex(/^\d{6}$/).optional(),
    bloodGroup: z.enum(BLOOD_GROUPS).optional(),
    donorEnrolled: z.boolean().optional(),
    availabilityPreference: z.enum(['AVAILABLE', 'UNAVAILABLE']).optional(),
    manualUnavailableReason: z.string().trim().max(200).optional(),
  }),
});

module.exports = { updateProfileSchema };
