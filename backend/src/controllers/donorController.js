const User = require('../models/User');
const { computeEffectiveStatus, daysUntilAvailable, availableOnDate } = require('../utils/donorStatus');

/**
 * GET /api/donors/status
 * Returns the authenticated user's full donor status snapshot.
 */
const getDonorStatus = async (req, res) => {
  try {
    const user = req.user;
    const effectiveStatus = computeEffectiveStatus(user);

    return res.json({
      donorEnrolled: user.donorEnrolled,
      availabilityPreference: user.availabilityPreference,
      manualUnavailableReason: user.manualUnavailableReason || null,
      lastDonationDate: user.lastDonationDate || null,
      effectiveStatus,
      daysUntilAvailable: daysUntilAvailable(user),
      availableOn: availableOnDate(user),
    });
  } catch (err) {
    console.error('getDonorStatus error:', err);
    return res.status(500).json({ message: 'Failed to retrieve donor status' });
  }
};

/**
 * PUT /api/donors/availability
 * Toggles the user's availability preference (AVAILABLE | UNAVAILABLE).
 * Body: { preference: 'AVAILABLE' | 'UNAVAILABLE', reason?: string }
 * Returns the new preference and the resulting effective status.
 */
const toggleAvailability = async (req, res) => {
  try {
    const { preference, reason } = req.body;

    if (!preference || !['AVAILABLE', 'UNAVAILABLE'].includes(preference)) {
      return res.status(400).json({
        message: 'preference must be "AVAILABLE" or "UNAVAILABLE"',
      });
    }

    const update = { availabilityPreference: preference };

    // Clear or set the opt-out reason.
    if (preference === 'UNAVAILABLE') {
      update.manualUnavailableReason = reason ? String(reason).trim() : undefined;
    } else {
      update.manualUnavailableReason = undefined;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const effectiveStatus = computeEffectiveStatus(user);

    return res.json({
      availabilityPreference: user.availabilityPreference,
      manualUnavailableReason: user.manualUnavailableReason || null,
      effectiveStatus,
      daysUntilAvailable: daysUntilAvailable(user),
      availableOn: availableOnDate(user),
    });
  } catch (err) {
    console.error('toggleAvailability error:', err);
    return res.status(500).json({ message: 'Failed to update availability' });
  }
};

module.exports = { getDonorStatus, toggleAvailability };
