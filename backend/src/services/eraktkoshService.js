const axios = require('axios');

const BASE_URL = 'https://eraktkosh.mohfw.gov.in/eraktkoshPortal/eraktkosh';
const TIMEOUT_MS = 20000;

const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'BloodLink2/1.0',
  },
});

// Maps eRaktKosh blood group names ("A+Ve", "O +ve", "Bombay (Oh)") to the
// BloodLink2 local enum ("A+", "O+", null). Normalisation: lowercase, strip
// spaces, drop a trailing "ve". Unknown values return null.
function mapToLocalBloodGroup(name) {
  if (!name) return null;
  const normalized = String(name).toLowerCase().replace(/\s+/g, '').replace(/ve$/, '');
  switch (normalized) {
    case 'a+': return 'A+';
    case 'a-': return 'A-';
    case 'b+': return 'B+';
    case 'b-': return 'B-';
    case 'o+': return 'O+';
    case 'o-': return 'O-';
    case 'ab+': return 'AB+';
    case 'ab-': return 'AB-';
    default: return null;
  }
}

// Stock strings come back like "O+Ve : 17", "O +ve : 0", "O+Ve : -5", "".
// Returns { units, rawGroup } or null if the string doesn't match the shape.
function parseStockString(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const match = raw.match(/^(.+?)\s*:\s*(-?\d+)\s*$/);
  if (!match) return null;
  return {
    rawGroup: match[1].trim(),
    units: parseInt(match[2], 10),
  };
}

// eRaktKosh returns each hospital with a `components` map keyed by component
// name; each value has either an `available_WithQty` or `not_available_WithQty`
// string (the other is empty). Flatten to a clean per-hospital record.
function normalizeAvailabilityRow(row) {
  const components = row.components || {};
  const componentName = Object.keys(components)[0] || null;
  const slot = componentName ? components[componentName] : {};

  const availableParsed = parseStockString(slot.available_WithQty);
  const notAvailableParsed = parseStockString(slot.not_available_WithQty);

  const stockInfo = availableParsed || notAvailableParsed;
  const units = stockInfo ? Math.max(0, stockInfo.units) : 0;
  const rawGroup = stockInfo ? stockInfo.rawGroup : null;

  return {
    hospital: {
      name: row.hospitalname?.trim() || '',
      address: row.hospitaladd?.trim() || '',
      contact: row.hospitalcontact?.trim() || '',
      code: row.hospitalCode || null,
      type: row.hospitalType || null,
    },
    component: componentName,
    bloodGroup: {
      raw: rawGroup,
      local: mapToLocalBloodGroup(rawGroup),
    },
    units,
    available: !!availableParsed && units > 0,
    lastUpdated: row.entrydate || null,
  };
}

// One-shot fetch of all reference data (states+districts, blood groups,
// components, plus a few extras we don't currently use).
async function fetchAllMasters() {
  const { data } = await client.post('/master/all', { hospitalCode: 100 });
  return data;
}

// Live blood availability lookup. All four codes are required by eRaktKosh.
async function fetchBloodAvailability({ stateCode, districtCode, bloodGroupCode, componentCode }) {
  const { data } = await client.get('/blood-availability', {
    params: {
      stateCode,
      districtId: districtCode,
      bloodGroupId: bloodGroupCode,
      componentId: componentCode,
    },
  });
  if (!Array.isArray(data)) return [];
  return data.map(normalizeAvailabilityRow);
}

module.exports = {
  fetchAllMasters,
  fetchBloodAvailability,
  mapToLocalBloodGroup,
  parseStockString,
  normalizeAvailabilityRow,
};
