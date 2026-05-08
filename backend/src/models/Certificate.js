const mongoose = require('mongoose');

const CERTIFICATE_STATES = ['ISSUED', 'REVOKED'];

const certificateSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: [true, 'Donation is required'],
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor is required'],
    },
    verificationId: {
      type: String,
      required: [true, 'Verification ID is required'],
      unique: true,
    },
    state: {
      type: String,
      enum: CERTIFICATE_STATES,
      default: 'ISSUED',
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
    pdfPath: {
      type: String,
      default: '',
    },
    qrPayload: {
      type: String,
      required: [true, 'QR payload is required'],
    },
    revokedAt: {
      type: Date,
    },
    revokedReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// verificationId index is created by `unique: true` on the field — no duplicate needed
certificateSchema.index({ donor: 1, issuedAt: -1 });
certificateSchema.index({ donation: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
