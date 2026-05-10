const mongoose = require('mongoose');

const PLEDGE_STATUS = ['ACCEPTED', 'FULFILLED', 'CANCELLED', 'NO_SHOW', 'VOID'];
const DONATION_TYPES = ['WHOLE_BLOOD', 'PLASMA', 'PLATELETS'];
const DONATION_STATES = ['RECORDED', 'VERIFIED', 'REJECTED'];

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor is required'],
    },
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
    },
    status: {
      type: String,
      enum: PLEDGE_STATUS,
      default: 'ACCEPTED',
    },
    // Hospital-side verification state; only set on recorded donations, not pledges.
    state: {
      type: String,
      enum: DONATION_STATES,
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
    },
    donatedAt: {
      type: Date,
      default: Date.now,
    },
    cancelReason: {
      type: String,
    },
    notes: {
      type: String,
    },
    certificateUrl: {
      type: String,
    },
    verificationId: {
      type: String,
    },
  },
  { timestamps: true }
);

donationSchema.index({ donor: 1, donatedAt: -1 });
donationSchema.index({ request: 1 });

module.exports = mongoose.model('Donation', donationSchema);
