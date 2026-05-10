const ErState = require('../models/ErState');
const ErBloodGroup = require('../models/ErBloodGroup');
const ErComponent = require('../models/ErComponent');
const { fetchBloodAvailability } = require('../services/eraktkoshService');

/**
 * GET /api/eraktkosh/states
 * Returns all states (without their districts to keep the payload small).
 */
const listStates = async (req, res) => {
  try {
    const states = await ErState.find({}, { stateCode: 1, stateName: 1, _id: 0 }).sort({
      stateName: 1,
    });
    return res.json(states);
  } catch (err) {
    console.error('listStates error:', err);
    return res.status(500).json({ message: 'Failed to load states' });
  }
};

/**
 * GET /api/eraktkosh/states/:stateCode/districts
 * Returns the districts for a single state.
 */
const listDistricts = async (req, res) => {
  try {
    const { stateCode } = req.params;
    const state = await ErState.findOne(
      { stateCode },
      { 'districts.districtCode': 1, 'districts.districtName': 1, _id: 0 }
    );
    if (!state) {
      return res.status(404).json({ message: 'State not found' });
    }
    const districts = [...state.districts].sort((a, b) =>
      a.districtName.localeCompare(b.districtName)
    );
    return res.json(districts);
  } catch (err) {
    console.error('listDistricts error:', err);
    return res.status(500).json({ message: 'Failed to load districts' });
  }
};

/**
 * GET /api/eraktkosh/blood-groups
 */
const listBloodGroups = async (req, res) => {
  try {
    const groups = await ErBloodGroup.find({}, { code: 1, name: 1, localBloodGroup: 1, _id: 0 }).sort({
      name: 1,
    });
    return res.json(groups);
  } catch (err) {
    console.error('listBloodGroups error:', err);
    return res.status(500).json({ message: 'Failed to load blood groups' });
  }
};

/**
 * GET /api/eraktkosh/components
 */
const listComponents = async (req, res) => {
  try {
    const components = await ErComponent.find(
      {},
      { code: 1, name: 1, shortName: 1, _id: 0 }
    ).sort({ name: 1 });
    return res.json(components);
  } catch (err) {
    console.error('listComponents error:', err);
    return res.status(500).json({ message: 'Failed to load components' });
  }
};

/**
 * GET /api/eraktkosh/availability
 * Query params: stateCode, districtCode, bloodGroupCode, componentCode (all required).
 * Proxies eRaktKosh's /blood-availability and returns a normalized list.
 */
const getAvailability = async (req, res) => {
  try {
    const { stateCode, districtCode, bloodGroupCode, componentCode } = req.query;

    const missing = [];
    if (!stateCode) missing.push('stateCode');
    if (!districtCode) missing.push('districtCode');
    if (!bloodGroupCode) missing.push('bloodGroupCode');
    if (!componentCode) missing.push('componentCode');
    if (missing.length) {
      return res.status(400).json({
        message: `Missing required query params: ${missing.join(', ')}`,
      });
    }

    const results = await fetchBloodAvailability({
      stateCode,
      districtCode,
      bloodGroupCode,
      componentCode,
    });

    // Sort: available first, then by units desc, then by hospital name.
    results.sort((a, b) => {
      if (a.available !== b.available) return a.available ? -1 : 1;
      if (a.units !== b.units) return b.units - a.units;
      return a.hospital.name.localeCompare(b.hospital.name);
    });

    return res.json({ count: results.length, results });
  } catch (err) {
    console.error('getAvailability error:', err.message);
    return res.status(502).json({
      message: 'Failed to reach eRaktKosh blood-availability service',
    });
  }
};

module.exports = {
  listStates,
  listDistricts,
  listBloodGroups,
  listComponents,
  getAvailability,
};
