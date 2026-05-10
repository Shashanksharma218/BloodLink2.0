const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const AVAILABILITY_PREFERENCE = ['AVAILABLE', 'UNAVAILABLE'];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    phone: {
      type: String,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: BLOOD_GROUPS,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    // Whether the user has opted into the donor programme at all.
    donorEnrolled: {
      type: Boolean,
      default: true,
    },
    // User-controlled intent; RECOVERING is derived, not stored.
    availabilityPreference: {
      type: String,
      enum: AVAILABILITY_PREFERENCE,
      default: 'AVAILABLE',
    },
    // Optional reason when user manually sets preference to UNAVAILABLE.
    manualUnavailableReason: {
      type: String,
      trim: true,
    },
    // Cached from the donations collection (MAX donatedAt where verified=true).
    // Updated atomically when a donation is marked COMPLETED.
    lastDonationDate: {
      type: Date,
      default: null,
      validate: {
        validator(v) {
          return v === null || v <= new Date();
        },
        message: 'lastDonationDate cannot be in the future',
      },
    },
    donationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifyTokenHash: {
      type: String,
      select: false,
    },
    emailVerifyExpires: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// Donor-matching query shape: WHERE availabilityPreference = 'AVAILABLE'
// AND (lastDonationDate IS NULL OR lastDonationDate < now - 56d)
// Composite index covers both predicates.
userSchema.index({ availabilityPreference: 1, lastDonationDate: 1 });
userSchema.index({ pincode: 1 });
userSchema.index({ bloodGroup: 1 });

module.exports = mongoose.model('User', userSchema);
