const mongoose = require('mongoose');

const HOSPITAL_STATES = ['UNVERIFIED', 'VERIFIED', 'SUSPENDED'];

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: 200,
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
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: 500,
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
    licenseNumber: {
      type: String,
      required: [true, 'License number is required'],
      trim: true,
      unique: true,
    },
    state: {
      type: String,
      enum: HOSPITAL_STATES,
      default: 'UNVERIFIED',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
    suspendedReason: {
      type: String,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

hospitalSchema.index({ pincode: 1 });
hospitalSchema.index({ state: 1 });
hospitalSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Hospital', hospitalSchema);
