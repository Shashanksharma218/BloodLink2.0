const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('../config/bloodCompatibility');

const REQUEST_STATUSES = [
  'PENDING_VERIFICATION',
  'VERIFIED',
  'PARTIALLY_FULFILLED',
  'FULFILLED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
];

const requestSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required'],
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
    },
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
      maxlength: 100,
    },
    patientAge: {
      type: Number,
      required: [true, 'Patient age is required'],
      min: 0,
      max: 130,
    },
    patientGender: {
      type: String,
      required: [true, 'Patient gender is required'],
      enum: ['M', 'F', 'OTHER'],
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: BLOOD_GROUPS,
    },
    unitsRequired: {
      type: Number,
      required: [true, 'Units required'],
      min: 1,
      max: 20,
    },
    unitsCollected: {
      type: Number,
      default: 0,
      min: 0,
    },
    urgency: {
      type: String,
      required: [true, 'Urgency is required'],
      enum: ['CRITICAL', 'HIGH', 'NORMAL'],
    },
    requiredBy: {
      type: Date,
      required: [true, 'Required by date is required'],
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: undefined },
    },
    patientContact: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      relationship: { type: String, required: true, trim: true },
    },
    seekerPhone: {
      type: String,
      required: [true, 'Seeker phone is required'],
      trim: true,
    },
    proofDocument: {
      type: String,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'PENDING_VERIFICATION',
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    verifiedAt: {
      type: Date,
    },
    rejectedReason: {
      type: String,
      trim: true,
    },
    rejectedCategory: {
      type: String,
      enum: ['INVALID_PROOF', 'DUPLICATE', 'UNREACHABLE', 'OTHER'],
    },
    cancelledAt: {
      type: Date,
    },
    cancelledReason: {
      type: String,
      trim: true,
    },
    expiredAt: {
      type: Date,
    },
    fulfilledAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

requestSchema.index({ requester: 1, createdAt: -1 });
requestSchema.index({ hospital: 1, status: 1, createdAt: -1 });
requestSchema.index({ status: 1, bloodGroup: 1, pincode: 1 });
requestSchema.index({ status: 1, requiredBy: 1 });
requestSchema.index({ status: 1, urgency: 1, createdAt: -1 });
requestSchema.index({ location: '2dsphere' }, { sparse: true });

module.exports = mongoose.model('Request', requestSchema);
