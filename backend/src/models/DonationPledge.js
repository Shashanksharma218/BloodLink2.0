const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('../config/bloodCompatibility');

const PLEDGE_STATUSES = ['ACCEPTED', 'FULFILLED', 'CANCELLED', 'NO_SHOW', 'VOID'];

const donationPledgeSchema = new mongoose.Schema(
  {
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Request',
      required: [true, 'Request is required'],
    },
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
    bloodGroup: {
      type: String,
      enum: BLOOD_GROUPS,
      required: [true, 'Blood group is required'],
    },
    status: {
      type: String,
      enum: PLEDGE_STATUSES,
      default: 'ACCEPTED',
    },
    acceptedAt: {
      type: Date,
      default: Date.now,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationActor: {
      type: String,
      enum: ['DONOR', 'SEEKER', 'HOSPITAL', 'SYSTEM'],
    },
    cancellationCategory: {
      type: String,
      enum: ['SCHEDULE_CONFLICT', 'HEALTH', 'DISTANCE', 'REQUEST_FULFILLED', 'REQUEST_EXPIRED', 'OTHER'],
    },
    cancellationNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    noShowAt: {
      type: Date,
    },
    fulfilledAt: {
      type: Date,
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
    },
  },
  { timestamps: true }
);

// Prevents a donor from pledging to the same request twice
donationPledgeSchema.index({ donor: 1, request: 1 }, { unique: true });
donationPledgeSchema.index({ request: 1, status: 1 });
donationPledgeSchema.index({ donor: 1, status: 1, createdAt: -1 });
donationPledgeSchema.index({ hospital: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model('DonationPledge', donationPledgeSchema);
