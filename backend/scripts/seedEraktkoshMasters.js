/**
 * Seeds the three eRaktKosh master collections (states+districts, blood groups,
 * components) from a single POST to /master/all.
 *
 * Idempotent: deletes and re-inserts each collection so re-running picks up
 * any upstream changes cleanly.
 *
 * Runs in two modes:
 *   1) CLI:  `node scripts/seedEraktkoshMasters.js`
 *      Loads .env, connects to Mongo, seeds, exits.
 *   2) Programmatic: `await seedEraktkoshMasters()` from a server already
 *      connected to Mongo (e.g. boot-time auto-seed). Caller manages the
 *      connection lifecycle.
 */
const path = require('path');
const mongoose = require('mongoose');

const ErState = require('../src/models/ErState');
const ErBloodGroup = require('../src/models/ErBloodGroup');
const ErComponent = require('../src/models/ErComponent');
const { fetchAllMasters, mapToLocalBloodGroup } = require('../src/services/eraktkoshService');

async function seedEraktkoshMasters() {
  console.log('[eraktkosh] fetching master data...');
  const masters = await fetchAllMasters();

  const states = (masters.statesWithDistricts || []).map((s) => ({
    stateCode: String(s.stateCode),
    stateName: s.stateName,
    districts: (s.districts || []).map((d) => ({
      districtCode: String(d.districtCode),
      districtName: d.districtName,
    })),
  }));

  const bloodGroups = (masters.bloodGroups || []).map((bg) => ({
    code: String(bg.bloodGroupCode),
    name: bg.bloodGroupName,
    localBloodGroup: mapToLocalBloodGroup(bg.bloodGroupName),
  }));

  const components = (masters.componentList || []).map((c) => ({
    code: String(c.componentCode),
    name: c.componentName,
    shortName: c.componentShortName || null,
  }));

  await Promise.all([
    ErState.deleteMany({}),
    ErBloodGroup.deleteMany({}),
    ErComponent.deleteMany({}),
  ]);

  await Promise.all([
    ErState.insertMany(states),
    ErBloodGroup.insertMany(bloodGroups),
    ErComponent.insertMany(components),
  ]);

  console.log(
    `[eraktkosh] seeded ${states.length} states, ${bloodGroups.length} blood groups, ${components.length} components`
  );

  return {
    states: states.length,
    bloodGroups: bloodGroups.length,
    components: components.length,
  };
}

// Boot-time helper: seed only if any of the three collections are empty.
// Failures are logged but never thrown, so a transient eRaktKosh outage on
// first boot doesn't crash the server — the user can re-run the CLI later.
async function seedEraktkoshMastersIfEmpty() {
  try {
    const [stateCount, bgCount, compCount] = await Promise.all([
      ErState.estimatedDocumentCount(),
      ErBloodGroup.estimatedDocumentCount(),
      ErComponent.estimatedDocumentCount(),
    ]);

    if (stateCount > 0 && bgCount > 0 && compCount > 0) {
      console.log(
        `[eraktkosh] masters already cached (${stateCount} states, ${bgCount} blood groups, ${compCount} components)`
      );
      return;
    }

    console.log('[eraktkosh] masters empty, seeding...');
    await seedEraktkoshMasters();
  } catch (err) {
    console.error('[eraktkosh] auto-seed failed:', err.message);
    console.error('[eraktkosh] you can retry manually with: node scripts/seedEraktkoshMasters.js');
  }
}

// CLI entry point.
if (require.main === module) {
  require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

  (async () => {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error('MONGO_URI is not set');
      }
      await mongoose.connect(process.env.MONGO_URI);
      console.log(`[eraktkosh] connected to ${mongoose.connection.host}`);
      await seedEraktkoshMasters();
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('[eraktkosh] seed failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = { seedEraktkoshMasters, seedEraktkoshMastersIfEmpty };
