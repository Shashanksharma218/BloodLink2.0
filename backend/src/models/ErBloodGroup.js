const mongoose = require('mongoose');

// Mirror of eRaktKosh blood group master.
// `localBloodGroup` maps to BloodLink2's internal enum (A+, B-, …) when
// possible; null for exotic groups like "Bombay (Oh)" that have no
// equivalent in our local enum.
const erBloodGroupSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    localBloodGroup: {
      type: String,
      default: null,
      enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', null],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ErBloodGroup', erBloodGroupSchema);
