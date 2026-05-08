const User = require('../../models/User');
const Donation = require('../../models/Donation');
const DonationPledge = require('../../models/DonationPledge');
const Certificate = require('../../models/Certificate');
const ApiError = require('../../utils/ApiError');
const { computeEffectiveStatus, daysUntilAvailable, availableOnDate } = require('../../utils/donorStatus');

const getProfile = (user) => {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.password;
  delete obj.__v;
  obj.effectiveStatus = computeEffectiveStatus(obj);
  obj.daysUntilAvailable = daysUntilAvailable(obj);
  obj.availableOn = availableOnDate(obj);
  return obj;
};

const updateProfile = async (userId, updates) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');
  if (!user) throw ApiError.notFound('User not found');
  return user;
};

const getDonations = async (donorId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [donations, total] = await Promise.all([
    Donation.find({ donor: donorId })
      .populate('hospital', 'name address pincode')
      .populate('request', 'bloodGroup patientName unitsRequired')
      .sort({ donatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Donation.countDocuments({ donor: donorId }),
  ]);
  return { donations, total };
};

const getPledges = async (donorId, { status, page = 1, limit = 20 } = {}) => {
  const filter = { donor: donorId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [pledges, total] = await Promise.all([
    DonationPledge.find(filter)
      .populate('request', 'patientName bloodGroup urgency requiredBy hospital status')
      .populate('hospital', 'name address phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    DonationPledge.countDocuments(filter),
  ]);
  return { pledges, total };
};

const getCertificates = async (donorId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;
  const [certificates, total] = await Promise.all([
    Certificate.find({ donor: donorId, state: 'ISSUED' })
      .populate('donation', 'donationType units donatedAt hospital')
      .sort({ issuedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Certificate.countDocuments({ donor: donorId, state: 'ISSUED' }),
  ]);
  return { certificates, total };
};

module.exports = { getProfile, updateProfile, getDonations, getPledges, getCertificates };
