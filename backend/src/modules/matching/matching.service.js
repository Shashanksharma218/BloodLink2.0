const User = require('../../models/User');
const DonationPledge = require('../../models/DonationPledge');
const { getCompatibleDonorGroups } = require('../../config/bloodCompatibility');
const { computeEffectiveStatus } = require('../../utils/donorStatus');
const { RECOVERY_PERIOD_DAYS } = require('../../config/donorConfig');

const BROADCAST_LIMITS = { CRITICAL: 100, HIGH: 50, NORMAL: 30 };

/**
 * Returns IDs of donors already pledged (in any non-void status) to this request.
 */
const getAlreadyPledgedDonorIds = async (requestId) => {
  const pledges = await DonationPledge.find(
    { request: requestId, status: { $in: ['ACCEPTED', 'FULFILLED', 'NO_SHOW'] } },
    { donor: 1 }
  ).lean();
  return pledges.map((p) => p.donor.toString());
};

/**
 * Finds eligible donors for a given request.
 * Returns a list of donor documents (without password).
 */
const findEligibleDonors = async (request) => {
  const compatibleGroups = getCompatibleDonorGroups(request.bloodGroup);
  if (!compatibleGroups.length) return [];

  const cutoffDate = new Date(Date.now() - RECOVERY_PERIOD_DAYS * 24 * 60 * 60 * 1000);
  const alreadyPledged = await getAlreadyPledgedDonorIds(request._id);

  const query = {
    donorEnrolled: true,
    availabilityPreference: 'AVAILABLE',
    bloodGroup: { $in: compatibleGroups },
    roles: 'donor',
    deletedAt: null,
    $or: [
      { lastDonationDate: null },
      { lastDonationDate: { $lte: cutoffDate } },
    ],
  };

  if (alreadyPledged.length) {
    query._id = { $nin: alreadyPledged };
  }

  // Tier 1: exact pincode match
  const tier1 = await User.find({ ...query, pincode: request.pincode })
    .select('-password')
    .lean();

  let donors = tier1;

  // Tier 2: expand to same first 3 digits of pincode (same district/city)
  if (donors.length < BROADCAST_LIMITS[request.urgency]) {
    const districtPrefix = request.pincode.slice(0, 3);
    const tier2Regex = new RegExp(`^${districtPrefix}`);
    const alreadyFoundIds = new Set(donors.map((d) => d._id.toString()));

    const tier2 = await User.find({
      ...query,
      pincode: { $regex: tier2Regex },
      _id: { $nin: [...alreadyPledged, ...Array.from(alreadyFoundIds)] },
    })
      .select('-password')
      .lean();

    donors = [...donors, ...tier2];
  }

  const limit = BROADCAST_LIMITS[request.urgency];

  // Filter by derived effective status (recovery check)
  const eligible = donors
    .filter((d) => computeEffectiveStatus(d) === 'AVAILABLE')
    .sort((a, b) => {
      // Sort: verified donors first, then fewer active pledges (no data yet, use donationsCount desc as proxy)
      if (a.verifiedDonor !== b.verifiedDonor) return b.verifiedDonor - a.verifiedDonor;
      return b.donationsCount - a.donationsCount;
    })
    .slice(0, limit);

  return eligible;
};

module.exports = { findEligibleDonors };
