const mongoose = require('mongoose');

const DONATION_STATUS = ['PENDING', 'CONFIRMED', 'COMPLETED'];
const DONATION_TYPES = ['WHOLE_BLOOD', 'PLASMA', 'PLATELETS'];

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
      required: [true, 'Request is required'],
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: [true, 'Hospital is required'],
    },
    status: {
      type: String,
      enum: DONATION_STATUS,
      default: 'PENDING',
    },
    donationType: {
      type: String,
      enum: DONATION_TYPES,
      default: 'WHOLE_BLOOD',
    },
    // When the donation physically occurred. Defaults to creation time but
    // can be set to an earlier value for offline/retrospective entries.
    donatedAt: {
      type: Date,
      default: Date.now,
      validate: {
        validator(v) {
          const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
          return v <= new Date() && v >= new Date(Date.now() - ONE_YEAR_MS);
        },
        message: 'donatedAt must be within the past year and not in the future',
      },
    },
    // True once a hospital admin confirms the donation took place.
    // Only verified donations update lastDonationDate on the User.
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
    },
    certificateUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

donationSchema.index({ donor: 1, donatedAt: -1 });

module.exports = mongoose.model('Donation', donationSchema);
