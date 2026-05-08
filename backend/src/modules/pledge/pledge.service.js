const mongoose = require('mongoose');
const DonationPledge = require('../../models/DonationPledge');
const Request = require('../../models/Request');
const ApiError = require('../../utils/ApiError');
const auditService = require('../audit/audit.service');
const notificationService = require('../notification/notification.service');
const { computeEffectiveStatus } = require('../../utils/donorStatus');
const { isCompatible } = require('../../config/bloodCompatibility');

const PLEDGEABLE_STATUSES = ['VERIFIED', 'PARTIALLY_FULFILLED'];

const accept = async (donor, requestId, actor, req) => {
  const request = await Request.findById(requestId)
    .populate('requester', 'name email phone')
    .populate('hospital', 'name email phone');
  if (!request) throw ApiError.notFound('Request not found');

  if (!PLEDGEABLE_STATUSES.includes(request.status)) {
    throw ApiError.invalidState(`Request is not accepting pledges (status: ${request.status})`);
  }
  if (new Date(request.requiredBy) < new Date()) {
    throw ApiError.invalidState('Request has already expired');
  }

  // Donor eligibility checks
  if (!donor.donorEnrolled) throw ApiError.forbidden('You are not enrolled as a donor');
  const effectiveStatus = computeEffectiveStatus(donor);
  if (effectiveStatus !== 'AVAILABLE') {
    throw ApiError.forbidden(`You are not eligible to donate right now (status: ${effectiveStatus})`);
  }
  if (!isCompatible(donor.bloodGroup, request.bloodGroup)) {
    throw ApiError.forbidden(`Your blood group (${donor.bloodGroup}) is not compatible with this request (${request.bloodGroup})`);
  }

  const pledge = await DonationPledge.create({
    request: requestId,
    donor: donor._id,
    hospital: request.hospital._id,
    bloodGroup: donor.bloodGroup,
  });

  await auditService.log({
    actor,
    action: auditService.ACTIONS.PLEDGE_CREATED,
    entityType: 'DonationPledge',
    entityId: pledge._id,
    metadata: { requestId },
    req,
  });

  notificationService.pledgeCreated(pledge, request.requester, request.hospital).catch(() => {});

  return pledge;
};

const cancel = async (donorId, pledgeId, { category, note }, actor, req) => {
  const pledge = await DonationPledge.findOne({ _id: pledgeId, donor: donorId });
  if (!pledge) throw ApiError.notFound('Pledge not found');
  if (pledge.status !== 'ACCEPTED') {
    throw ApiError.invalidState(`Cannot cancel a pledge with status: ${pledge.status}`);
  }

  pledge.status = 'CANCELLED';
  pledge.cancellationActor = 'DONOR';
  pledge.cancellationCategory = category;
  pledge.cancellationNote = note || undefined;
  pledge.cancelledAt = new Date();
  await pledge.save();

  await auditService.log({
    actor,
    action: auditService.ACTIONS.PLEDGE_CANCELLED,
    entityType: 'DonationPledge',
    entityId: pledge._id,
    metadata: { category, note },
    req,
  });

  // Notify seeker
  const request = await Request.findById(pledge.request).populate('requester', 'name email');
  if (request?.requester) {
    notificationService.pledgeCancelled(pledge, request.requester).catch(() => {});
  }

  return pledge;
};

const getById = async (pledgeId, actor) => {
  const pledge = await DonationPledge.findById(pledgeId)
    .populate('donor', 'name phone bloodGroup')
    .populate('request', 'patientName bloodGroup urgency requiredBy hospital status')
    .populate('hospital', 'name address phone')
    .lean();
  if (!pledge) throw ApiError.notFound('Pledge not found');

  const isDonor = actor.accountType === 'user' &&
    pledge.donor?._id?.toString() === actor.id.toString();
  const isHospital = actor.accountType === 'hospital' &&
    pledge.hospital?._id?.toString() === actor.id.toString();
  const isAdmin = actor.roles?.includes('admin');

  if (!isDonor && !isHospital && !isAdmin) throw ApiError.forbidden();
  return pledge;
};

module.exports = { accept, cancel, getById };
