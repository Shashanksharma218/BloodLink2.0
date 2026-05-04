const mongoose = require('mongoose');

const DONATION_STATUS = ['PENDING', 'CONFIRMED', 'COMPLETED'];

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
    certificateUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Donation', donationSchema);
