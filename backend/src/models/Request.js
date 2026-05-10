const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const REQUEST_STATUS = [
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
    patient: {
      name: { type: String, required: [true, 'Patient name is required'], trim: true },
      age: { type: Number, min: 0, max: 130 },
      gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: BLOOD_GROUPS,
    },
    unitsRequired: {
      type: Number,
      required: [true, 'Units required is required'],
      min: 1,
    },
    unitsFulfilled: {
      type: Number,
      default: 0,
      min: 0,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    pincode: {
      type: String,
      required: [true, 'Pincode is required'],
      trim: true,
    },
    urgency: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'NORMAL'],
      default: 'NORMAL',
    },
    requiredBy: {
      type: Date,
    },
    status: {
      type: String,
      enum: REQUEST_STATUS,
      default: 'PENDING_VERIFICATION',
    },
    patientContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
    notes: {
      type: String,
      trim: true,
    },
    proofDocument: {
      type: String,
    },
    rejectionReason: {
      type: String,
    },
    donors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

requestSchema.index({ pincode: 1 });
requestSchema.index({ bloodGroup: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ requester: 1 });

module.exports = mongoose.model('Request', requestSchema);
