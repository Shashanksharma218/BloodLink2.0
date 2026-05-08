const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('../config/bloodCompatibility');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 100,
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
      required: [true, 'Phone is required'],
      trim: true,
    },
    roles: {
      type: [String],
      enum: ['donor', 'seeker', 'admin'],
      default: ['donor', 'seeker'],
    },
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
      match: [/^\d{6}$/, 'Pincode must be 6 digits'],
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    donorEnrolled: {
      type: Boolean,
      default: true,
    },
    availabilityPreference: {
      type: String,
      enum: ['AVAILABLE', 'UNAVAILABLE'],
      default: 'AVAILABLE',
    },
    manualUnavailableReason: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    lastDonationDate: {
      type: Date,
      default: null,
      validate: {
        validator(v) { return v === null || v <= new Date(); },
        message: 'lastDonationDate cannot be in the future',
      },
    },
    donationsCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    verifiedDonor: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ availabilityPreference: 1, lastDonationDate: 1, bloodGroup: 1 });
userSchema.index({ pincode: 1 });
userSchema.index({ roles: 1 });
userSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('User', userSchema);
