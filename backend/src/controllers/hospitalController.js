const Hospital = require('../models/Hospital');

const searchHospitals = async (req, res) => {
  try {
    const { pincode, search } = req.query;
    const filter = {};

    if (pincode && search) {
      filter.pincode = pincode.trim();
      filter.name = { $regex: search.trim(), $options: 'i' };
    } else if (pincode) {
      filter.pincode = pincode.trim();
    } else if (search) {
      const term = search.trim();
      filter.$or = [
        { name: { $regex: term, $options: 'i' } },
        { pincode: term },
      ];
    }

    const hospitals = await Hospital.find(filter)
      .select('_id name address pincode phone')
      .limit(15)
      .lean();

    res.json({ data: hospitals });
  } catch (err) {
    console.error('searchHospitals error:', err);
    res.status(500).json({ message: 'Failed to search hospitals' });
  }
};

module.exports = { searchHospitals };
