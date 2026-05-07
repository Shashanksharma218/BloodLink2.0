module.exports = {
  // Days a donor must wait after a whole-blood donation before donating again.
  // Sourced from WHO/AABB guidelines. Change via env var without a migration.
  RECOVERY_PERIOD_DAYS: parseInt(process.env.RECOVERY_PERIOD_DAYS || '56', 10),
};
