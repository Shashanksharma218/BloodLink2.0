const User = require('../models/User');
const Donation = require('../models/Donation');
const Certificate = require('../models/Certificate');
const { computeEffectiveStatus, daysUntilAvailable } = require('../utils/donorStatus');

const getDonorProfile = async (req, res) => {
  try {
    const user = req.user;
    const [donationCount, activePledgeCount, certificateCount] = await Promise.all([
      Donation.countDocuments({ donor: user._id, status: 'FULFILLED' }),
      Donation.countDocuments({ donor: user._id, status: 'ACCEPTED' }),
      Certificate.countDocuments({ donor: user._id }),
    ]);

    return res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      bloodGroup: user.bloodGroup,
      pincode: user.pincode,
      donorEnrolled: user.donorEnrolled,
      availabilityPreference: user.availabilityPreference,
      manualUnavailableReason: user.manualUnavailableReason || null,
      lastDonationDate: user.lastDonationDate || null,
      effectiveStatus: computeEffectiveStatus(user),
      daysUntilAvailable: daysUntilAvailable(user),
      donationCount,
      activePledgeCount,
      certificateCount,
    });
  } catch (err) {
    console.error('getDonorProfile error:', err);
    return res.status(500).json({ message: 'Failed to retrieve donor profile' });
  }
};

const updateDonorProfile = async (req, res) => {
  try {
    const { name, phone, pincode, availabilityPreference, manualUnavailableReason } = req.body;
    const update = {};
    if (name) update.name = name;
    if (phone !== undefined) update.phone = phone;
    if (pincode) update.pincode = pincode;
    if (availabilityPreference) {
      update.availabilityPreference = availabilityPreference;
      update.manualUnavailableReason =
        availabilityPreference === 'UNAVAILABLE' ? (manualUnavailableReason || '') : '';
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    console.error('updateDonorProfile error:', err);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

const getDonorDonations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { donor: req.user._id, status: 'FULFILLED' };

    const [donations, total] = await Promise.all([
      Donation.find(filter)
        .sort({ donatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({ path: 'request', select: 'bloodGroup unitsRequired patient' })
        .populate('hospital', 'name'),
      Donation.countDocuments(filter),
    ]);

    return res.json({ donations, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getDonorDonations error:', err);
    return res.status(500).json({ message: 'Failed to retrieve donations' });
  }
};

const getDonorPledges = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { donor: req.user._id, status: 'ACCEPTED' };

    const [pledges, total] = await Promise.all([
      Donation.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: 'request',
          select: 'bloodGroup unitsRequired patient hospital urgency requiredBy status',
          populate: { path: 'hospital', select: 'name pincode' },
        })
        .populate('hospital', 'name pincode'),
      Donation.countDocuments(filter),
    ]);

    return res.json({ pledges, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('getDonorPledges error:', err);
    return res.status(500).json({ message: 'Failed to retrieve pledges' });
  }
};

const getDonorCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const filter = { donor: req.user._id };

    const [certificates, total] = await Promise.all([
      Certificate.find(filter)
        .sort({ issuedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('hospital', 'name'),
      Certificate.countDocuments(filter),
    ]);

    return res.json({
      certificates,
      meta: { total, page: Number(page), limit: Number(limit) },
    });
  } catch (err) {
    console.error('getDonorCertificates error:', err);
    return res.status(500).json({ message: 'Failed to retrieve certificates' });
  }
};

module.exports = {
  getDonorProfile,
  updateDonorProfile,
  getDonorDonations,
  getDonorPledges,
  getDonorCertificates,
};
