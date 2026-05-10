const mongoose = require('mongoose');

// Mirror of eRaktKosh state master with districts nested inside.
// Source: POST /eraktkoshPortal/eraktkosh/master/all -> statesWithDistricts.
const districtSchema = new mongoose.Schema(
  {
    districtCode: { type: String, required: true, trim: true },
    districtName: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const erStateSchema = new mongoose.Schema(
  {
    stateCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stateName: {
      type: String,
      required: true,
      trim: true,
    },
    districts: [districtSchema],
  },
  { timestamps: true }
);

erStateSchema.index({ stateName: 1 });

module.exports = mongoose.model('ErState', erStateSchema);
