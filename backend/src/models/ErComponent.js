const mongoose = require('mongoose');

// Mirror of eRaktKosh blood component master (Whole Blood, PRBC, etc.).
const erComponentSchema = new mongoose.Schema(
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
    shortName: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ErComponent', erComponentSchema);
