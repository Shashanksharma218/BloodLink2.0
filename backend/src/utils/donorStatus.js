const { RECOVERY_PERIOD_DAYS } = require('../config/donorConfig');

const RECOVERY_MS = RECOVERY_PERIOD_DAYS * 24 * 60 * 60 * 1000;

/**
 * Derives the donor's effective status from stored fields.
 * Priority: INELIGIBLE > RECOVERING > UNAVAILABLE > AVAILABLE
 *
 * @param {object} user - Plain object or Mongoose doc with donor fields.
 * @param {Date}   now  - Injection point for testability; defaults to Date.now().
 * @returns {'AVAILABLE'|'RECOVERING'|'UNAVAILABLE'|'INELIGIBLE'}
 */
function computeEffectiveStatus(user, now = new Date()) {
  if (!user.donorEnrolled) return 'INELIGIBLE';

  if (user.lastDonationDate) {
    const elapsed = now - new Date(user.lastDonationDate);
    if (elapsed < RECOVERY_MS) return 'RECOVERING';
  }

  if (user.availabilityPreference === 'UNAVAILABLE') return 'UNAVAILABLE';

  return 'AVAILABLE';
}

/**
 * Returns the number of whole days remaining in the recovery window.
 * Returns 0 if the user is not currently recovering.
 */
function daysUntilAvailable(user, now = new Date()) {
  if (!user.lastDonationDate) return 0;
  const elapsed = now - new Date(user.lastDonationDate);
  const remaining = RECOVERY_MS - elapsed;
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / (24 * 60 * 60 * 1000));
}

/**
 * Returns the UTC Date when the recovery window ends, or null if not recovering.
 */
function availableOnDate(user, now = new Date()) {
  if (!user.lastDonationDate) return null;
  const elapsed = now - new Date(user.lastDonationDate);
  if (elapsed >= RECOVERY_MS) return null;
  return new Date(new Date(user.lastDonationDate).getTime() + RECOVERY_MS);
}

module.exports = { computeEffectiveStatus, daysUntilAvailable, availableOnDate };
