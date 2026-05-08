const mongoose = require('mongoose');

const DONATION_STATES = ['RECORDED', 'VERIFIED', 'REJECTED'];
const DONATION_TYPES = ['WHOLE_BLOOD', 'PLASMA', 'PLATELETS'];

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor is required'],
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
    },
    pledge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DonationPledge',
    },
    donationType: {
      type: String,
      enum: DONATION_TYPES,
      default: 'WHOLE_BLOOD',
    },
    units: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },
    donatedAt: {
      type: Date,
      default: Date.now,
      validate: {
        validator(v) { return v <= new Date(); },
        message: 'donatedAt cannot be in the future',
      },
    },
    state: {
      type: String,
      enum: DONATION_STATES,
      default: 'RECORDED',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'recordedBy is required'],
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
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

donationSchema.index({ donor: 1, donatedAt: -1 });
donationSchema.index({ hospital: 1, donatedAt: -1 });
donationSchema.index({ pledge: 1 });
donationSchema.index({ state: 1, createdAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
