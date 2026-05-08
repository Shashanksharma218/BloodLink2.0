module.exports = {
  RECOVERY_PERIOD_DAYS: parseInt(process.env.RECOVERY_PERIOD_DAYS || '56', 10),
  PLASMA_RECOVERY_DAYS: parseInt(process.env.PLASMA_RECOVERY_DAYS || '28', 10),
  PLATELET_RECOVERY_DAYS: parseInt(process.env.PLATELET_RECOVERY_DAYS || '7', 10),
};
