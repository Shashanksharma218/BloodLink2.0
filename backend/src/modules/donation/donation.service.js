const mongoose = require('mongoose');
const Donation = require('../../models/Donation');
const DonationPledge = require('../../models/DonationPledge');
const Request = require('../../models/Request');
const User = require('../../models/User');
const Certificate = require('../../models/Certificate');
const ApiError = require('../../utils/ApiError');
const auditService = require('../audit/audit.service');
const notificationService = require('../notification/notification.service');
const certificateService = require('../certificate/certificate.service');

const record = async (hospitalId, { pledgeId, donorId, donationType, units, donatedAt, notes }, actor, req) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let pledge = null;
    let resolvedDonorId = donorId;
    let requestId = null;

    if (pledgeId) {
      pledge = await DonationPledge.findOne(
        { _id: pledgeId, hospital: hospitalId, status: 'ACCEPTED' },
        null, { session }
      );
      if (!pledge) throw ApiError.notFound('Active pledge not found for this hospital');
      resolvedDonorId = pledge.donor;
      requestId = pledge.request;
    }

    const donation = await Donation.create([{
      donor: resolvedDonorId,
      hospital: hospitalId,
      request: requestId,
      pledge: pledge?._id,
      donationType: donationType || 'WHOLE_BLOOD',
      units: units || 1,
      donatedAt: donatedAt ? new Date(donatedAt) : new Date(),
      recordedBy: hospitalId,
      notes,
    }], { session });

    if (pledge) {
      pledge.status = 'FULFILLED';
      pledge.fulfilledAt = new Date();
      pledge.donation = donation[0]._id;
      await pledge.save({ session });
    }

    await session.commitTransaction();

    await auditService.log({
      actor,
      action: auditService.ACTIONS.DONATION_RECORDED,
      entityType: 'Donation',
      entityId: donation[0]._id,
      metadata: { pledgeId, donorId: resolvedDonorId, donationType },
      req,
    });

    if (pledge) {
      await auditService.log({
        actor,
        action: auditService.ACTIONS.PLEDGE_FULFILLED,
        entityType: 'DonationPledge',
        entityId: pledge._id,
        req,
      });
    }

    return donation[0];
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const verify = async (hospitalId, donationId, actor, req) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const donation = await Donation.findOne(
      { _id: donationId, hospital: hospitalId, state: 'RECORDED' },
      null, { session }
    );
    if (!donation) throw ApiError.notFound('Recorded donation not found for this hospital');

    // 1. Verify donation
    donation.state = 'VERIFIED';
    donation.verifiedBy = hospitalId;
    donation.verifiedAt = new Date();
    await donation.save({ session });

    // 2. Update donor counters atomically
    await User.findByIdAndUpdate(
      donation.donor,
      {
        $inc: { donationsCount: 1 },
        $max: { lastDonationDate: donation.donatedAt },
        $set: { verifiedDonor: true },
      },
      { session }
    );

    // 3. Update request units if linked
    let requestFulfilled = false;
    if (donation.request) {
      const updatedRequest = await Request.findOneAndUpdate(
        { _id: donation.request, status: { $in: ['VERIFIED', 'PARTIALLY_FULFILLED'] } },
        { $inc: { unitsCollected: donation.units } },
        { new: true, session }
      );

      if (updatedRequest) {
        if (updatedRequest.unitsCollected >= updatedRequest.unitsRequired) {
          updatedRequest.status = 'FULFILLED';
          updatedRequest.fulfilledAt = new Date();
          requestFulfilled = true;
        } else if (updatedRequest.status === 'VERIFIED') {
          updatedRequest.status = 'PARTIALLY_FULFILLED';
        }
        await updatedRequest.save({ session });
      }
    }

    // 4. Issue certificate row (PDF generated after transaction)
    const cert = await certificateService.createRecord(donation, { session });

    await session.commitTransaction();

    // Audit events
    await auditService.log({
      actor,
      action: auditService.ACTIONS.DONATION_VERIFIED,
      entityType: 'Donation',
      entityId: donation._id,
      req,
    });
    await auditService.log({
      actor,
      action: auditService.ACTIONS.CERT_ISSUED,
      entityType: 'Certificate',
      entityId: cert._id,
      req,
    });
    if (requestFulfilled) {
      await auditService.log({
        actor,
        action: auditService.ACTIONS.REQUEST_FULFILLED,
        entityType: 'Request',
        entityId: donation.request,
        req,
      });
    }

    // Generate PDF outside transaction
    const downloadUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/certificates/${cert._id}/download`;
    certificateService.generatePdf(cert, donation).catch((err) => {
      console.error('[certificate] PDF generation failed:', err.message);
    });

    const donor = await User.findById(donation.donor).select('name email').lean();
    notificationService.donationVerified(donation, donor, downloadUrl).catch(() => {});

    return { donation, certificate: cert };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
};

const reject = async (hospitalId, donationId, reason, actor, req) => {
  const donation = await Donation.findOne({ _id: donationId, hospital: hospitalId });
  if (!donation) throw ApiError.notFound('Donation not found');
  if (donation.state !== 'RECORDED') {
    throw ApiError.invalidState(`Cannot reject a donation in state: ${donation.state}`);
  }

  donation.state = 'REJECTED';
  donation.rejectedReason = reason;
  await donation.save();

  await auditService.log({
    actor,
    action: auditService.ACTIONS.DONATION_REJECTED,
    entityType: 'Donation',
    entityId: donation._id,
    metadata: { reason },
    req,
  });

  return donation;
};

const listForHospital = async (hospitalId, { state, page = 1, limit = 20 } = {}) => {
  const filter = { hospital: hospitalId };
  if (state) filter.state = state;
  const skip = (page - 1) * limit;
  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .populate('donor', 'name bloodGroup phone')
      .populate('pledge', 'status')
      .sort({ donatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Donation.countDocuments(filter),
  ]);
  return { donations, total };
};

module.exports = { record, verify, reject, listForHospital };
