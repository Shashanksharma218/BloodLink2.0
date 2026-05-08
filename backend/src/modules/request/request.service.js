const mongoose = require('mongoose');
const Request = require('../../models/Request');
const DonationPledge = require('../../models/DonationPledge');
const Hospital = require('../../models/Hospital');
const ApiError = require('../../utils/ApiError');
const auditService = require('../audit/audit.service');
const notificationService = require('../notification/notification.service');

const TERMINAL_STATUSES = ['REJECTED', 'FULFILLED', 'CANCELLED', 'EXPIRED'];

const create = async (seekerId, seekerPhone, body, proofPath, actor, req) => {
  const { hospitalId, patientName, patientAge, patientGender, bloodGroup,
    unitsRequired, urgency, requiredBy, patientContact, notes } = body;

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) throw ApiError.notFound('Hospital not found');
  if (hospital.state !== 'VERIFIED') throw ApiError.badRequest('Selected hospital is not verified');

  const request = await Request.create({
    requester: seekerId,
    hospital: hospitalId,
    patientName,
    patientAge,
    patientGender,
    bloodGroup,
    unitsRequired,
    urgency,
    requiredBy: new Date(requiredBy),
    pincode: hospital.pincode,
    patientContact,
    seekerPhone,
    proofDocument: proofPath || undefined,
    notes,
  });

  await auditService.log({
    actor,
    action: auditService.ACTIONS.REQUEST_CREATED,
    entityType: 'Request',
    entityId: request._id,
    req,
  });

  return request;
};

const listForSeeker = async (seekerId, { status, page = 1, limit = 20 } = {}) => {
  const filter = { requester: seekerId };
  if (status) filter.status = status;
  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('hospital', 'name address phone pincode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);
  return { requests, total };
};

const getById = async (requestId, actor) => {
  const request = await Request.findById(requestId)
    .populate('requester', 'name phone')
    .populate('hospital', 'name address phone pincode')
    .lean();
  if (!request) throw ApiError.notFound('Request not found');

  // Ownership check
  const isSeeker = actor.accountType === 'user' &&
    request.requester?._id?.toString() === actor.id.toString();
  const isHospital = actor.accountType === 'hospital' &&
    request.hospital?._id?.toString() === actor.id.toString();
  const isAdmin = actor.roles?.includes('admin');

  if (!isSeeker && !isHospital && !isAdmin) throw ApiError.forbidden();
  return request;
};

const cancel = async (seekerId, requestId, reason, actor, req) => {
  const request = await Request.findOne({ _id: requestId, requester: seekerId });
  if (!request) throw ApiError.notFound('Request not found');
  if (TERMINAL_STATUSES.includes(request.status)) {
    throw ApiError.invalidState(`Cannot cancel a request in status: ${request.status}`);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    request.status = 'CANCELLED';
    request.cancelledAt = new Date();
    request.cancelledReason = reason;
    await request.save({ session });

    const voidedPledges = await DonationPledge.find(
      { request: requestId, status: 'ACCEPTED' },
      null,
      { session }
    ).populate('donor', 'name email').lean();

    await DonationPledge.updateMany(
      { request: requestId, status: 'ACCEPTED' },
      { $set: { status: 'VOID', cancellationActor: 'SEEKER', cancellationCategory: 'REQUEST_FULFILLED', cancelledAt: new Date() } },
      { session }
    );

    await session.commitTransaction();

    await auditService.log({
      actor,
      action: auditService.ACTIONS.REQUEST_CANCELLED,
      entityType: 'Request',
      entityId: request._id,
      metadata: { reason },
      req,
    });

    const donors = voidedPledges.map((p) => p.donor).filter(Boolean);
    notificationService.requestExpiredOrCancelled(request, donors).catch(() => {});

    return request;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const getPledgesForSeeker = async (seekerId, requestId) => {
  const request = await Request.findOne({ _id: requestId, requester: seekerId });
  if (!request) throw ApiError.notFound('Request not found');

  // Only expose donor PII for ACCEPTED or FULFILLED pledges
  return DonationPledge.find({
    request: requestId,
    status: { $in: ['ACCEPTED', 'FULFILLED', 'NO_SHOW'] },
  })
    .populate('donor', 'name phone bloodGroup donationsCount verifiedDonor')
    .sort({ createdAt: -1 })
    .lean();
};

// Donor feed: verified requests matching the donor's blood group and pincode
const getFeedForDonor = async (donor, { page = 1, limit = 20 } = {}) => {
  const { getCompatibleDonorGroups } = require('../../config/bloodCompatibility');
  const compatibleGroups = getCompatibleDonorGroups(donor.bloodGroup);

  // Donor can donate to requests where their blood is compatible
  // i.e., donor.bloodGroup is in compatibleDonors[request.bloodGroup]
  // We need requests whose bloodGroup the donor is compatible for
  const matchingBloodGroups = Object.entries(
    require('../../config/bloodCompatibility').COMPATIBILITY_MAP
  )
    .filter(([, donors]) => donors.includes(donor.bloodGroup))
    .map(([recipient]) => recipient);

  const filter = {
    status: { $in: ['VERIFIED', 'PARTIALLY_FULFILLED'] },
    bloodGroup: { $in: matchingBloodGroups },
    requiredBy: { $gt: new Date() },
  };

  const skip = (page - 1) * limit;
  const [requests, total] = await Promise.all([
    Request.find(filter)
      .populate('hospital', 'name address pincode phone')
      .sort({ urgency: 1, requiredBy: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Request.countDocuments(filter),
  ]);
  return { requests, total };
};

module.exports = { create, listForSeeker, getById, cancel, getPledgesForSeeker, getFeedForDonor };
