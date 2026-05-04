const mongoose = require('mongoose');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const REQUEST_STATUS = ['PENDING', 'APPROVED', 'REJECTED', 'COMPLETED'];

const requestSchema = new mongoose.Schema(
  {
    patientName: {
      type: String,
      required: [true, 'Patient name is required'],
      trim: true,
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
    status: {
      type: String,
      enum: REQUEST_STATUS,
      default: 'PENDING',
    },
    proofDocument: {
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

// Indexes to speed up donor-matching queries (by location and blood group).
requestSchema.index({ pincode: 1 });
requestSchema.index({ bloodGroup: 1 });

module.exports = mongoose.model('Request', requestSchema);
