const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Donation',
      required: true,
      unique: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: true,
    },
    // Snapshotted at issue time so the certificate stays accurate
    // even if the donor or hospital later edit their profile.
    donorName: { type: String, required: true },
    hospitalName: { type: String, required: true },
    bloodGroup: { type: String },
    donationType: { type: String, required: true },
    units: { type: Number, default: 1 },
    donatedAt: { type: Date, required: true },

    certificateNumber: {
      type: String,
      required: true,
      unique: true,
    },
    verificationId: {
      type: String,
      required: true,
      unique: true,
    },
    pdfPath: {
      type: String,
    },
    issuedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

certificateSchema.index({ donor: 1, issuedAt: -1 });

module.exports = mongoose.model('Certificate', certificateSchema);
