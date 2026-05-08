const Request = require('../../models/Request');
const DonationPledge = require('../../models/DonationPledge');
const Hospital = require('../../models/Hospital');
const ApiError = require('../../utils/ApiError');
const auditService = require('../audit/audit.service');
const notificationService = require('../notification/notification.service');

const getQueue = async (hospitalId, { status, page = 1, limit = 20 } = {}) => {
  const filter = { hospital: hospitalId };
  if (status) {
    filter.status = status;
  } else {
    filter.status = { $in: ['PENDING_VERIFICATION', 'VERIFIED', 'PARTIALLY_FULFILLED'] };
  }
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('requester', 'name phone')
      .sort({ urgency: 1, createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);
  return { requests, total };
};

const verifyRequest = async (hospitalId, requestId, actor, req) => {
  const request = await Request.findOne({ _id: requestId, hospital: hospitalId });
  if (!request) throw ApiError.notFound('Request not found');
  if (request.status !== 'PENDING_VERIFICATION') {
    throw ApiError.invalidState(`Cannot verify a request in status: ${request.status}`);
  }

  request.status = 'VERIFIED';
  request.verifiedBy = hospitalId;
  request.verifiedAt = new Date();
  await request.save();

  await auditService.log({
    actor,
    action: auditService.ACTIONS.REQUEST_VERIFIED,
    entityType: 'Request',
    entityId: request._id,
    req,
  });

  notificationService.requestVerified(request).catch(() => {});

  return request;
};

const rejectRequest = async (hospitalId, requestId, { category, reason }, actor, req) => {
  const request = await Request.findOne({ _id: requestId, hospital: hospitalId });
  if (!request) throw ApiError.notFound('Request not found');
  if (request.status !== 'PENDING_VERIFICATION') {
    throw ApiError.invalidState(`Cannot reject a request in status: ${request.status}`);
  }

  request.status = 'REJECTED';
  request.rejectedCategory = category;
  request.rejectedReason = reason;
  await request.save();

  await auditService.log({
    actor,
    action: auditService.ACTIONS.REQUEST_REJECTED,
    entityType: 'Request',
    entityId: request._id,
    metadata: { category, reason },
    req,
  });

  notificationService.requestRejected(request).catch(() => {});

  return request;
};

const getRequestPledges = async (hospitalId, requestId) => {
  const request = await Request.findOne({ _id: requestId, hospital: hospitalId });
  if (!request) throw ApiError.notFound('Request not found');

  return DonationPledge.find({ request: requestId })
    .populate('donor', 'name phone bloodGroup donationsCount verifiedDonor')
    .sort({ createdAt: -1 })
    .lean();
};

const markNoShow = async (hospitalId, pledgeId, { note }, actor, req) => {
  const pledge = await DonationPledge.findOne({ _id: pledgeId, hospital: hospitalId });
  if (!pledge) throw ApiError.notFound('Pledge not found');
  if (pledge.status !== 'ACCEPTED') {
    throw ApiError.invalidState(`Cannot mark no-show on pledge with status: ${pledge.status}`);
  }

  pledge.status = 'NO_SHOW';
  pledge.noShowAt = new Date();
  if (note) pledge.cancellationNote = note;
  await pledge.save();

  await auditService.log({
    actor,
    action: auditService.ACTIONS.PLEDGE_NO_SHOW,
    entityType: 'DonationPledge',
    entityId: pledge._id,
    metadata: { note },
    req,
  });

  return pledge;
};

const getProfile = async (hospitalId) => {
  const hospital = await Hospital.findById(hospitalId).select('-password').lean();
  if (!hospital) throw ApiError.notFound('Hospital not found');
  return hospital;
};

const updateProfile = async (hospitalId, updates) => {
  const hospital = await Hospital.findByIdAndUpdate(
    hospitalId,
    { $set: updates },
    { new: true, runValidators: true }
  ).select('-password');
  if (!hospital) throw ApiError.notFound('Hospital not found');
  return hospital;
};

module.exports = {
  getQueue,
  verifyRequest,
  rejectRequest,
  getRequestPledges,
  markNoShow,
  getProfile,
  updateProfile,
};
