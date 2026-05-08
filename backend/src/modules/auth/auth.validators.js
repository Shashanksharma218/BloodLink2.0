const { z } = require('zod');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

const registerSchema = z.object({
  body: z.object({
    accountType: z.enum(['user', 'hospital'], { required_error: 'accountType is required' }),
    name: z.string().trim().min(1).max(100),
    email: z.string().email().toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    phone: z.string().trim().min(10, 'Valid phone number required'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    // User-only
    bloodGroup: z.enum(BLOOD_GROUPS).optional(),
    donorEnrolled: z.boolean().optional(),
    // Hospital-only
    address: z.string().trim().max(500).optional(),
    licenseNumber: z.string().trim().optional(),
  }).refine((d) => {
    if (d.accountType === 'user' && !d.bloodGroup) return false;
    if (d.accountType === 'hospital' && (!d.address || !d.licenseNumber)) return false;
    return true;
  }, { message: 'Missing required fields for account type' }),
});

const loginSchema = z.object({
  body: z.object({
    accountType: z.enum(['user', 'hospital']),
    email: z.string().email().toLowerCase(),
    password: z.string().min(1),
  }),
});

const changePasswordSchema = z.object({
  body: z.object({
    current: z.string().min(1),
    next: z.string().min(6, 'New password must be at least 6 characters'),
  }),
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };
