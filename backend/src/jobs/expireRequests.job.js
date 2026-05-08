const cron = require('node-cron');
const mongoose = require('mongoose');
const Request = require('../models/Request');
const DonationPledge = require('../models/DonationPledge');
const auditService = require('../modules/audit/audit.service');
const notificationService = require('../modules/notification/notification.service');

const GRACE_HOURS = 6;

const runExpiry = async () => {
  const cutoff = new Date(Date.now() - GRACE_HOURS * 60 * 60 * 1000);

  const expirableRequests = await Request.find({
    status: { $in: ['PENDING_VERIFICATION', 'VERIFIED', 'PARTIALLY_FULFILLED'] },
    requiredBy: { $lt: cutoff },
  }).lean();

  if (!expirableRequests.length) return;

  for (const request of expirableRequests) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      await Request.findByIdAndUpdate(
        request._id,
        { $set: { status: 'EXPIRED', expiredAt: new Date() } },
        { session }
      );

      const voidedPledges = await DonationPledge.find(
        { request: request._id, status: 'ACCEPTED' },
        null, { session }
      ).populate('donor', 'name email').lean();

      await DonationPledge.updateMany(
        { request: request._id, status: 'ACCEPTED' },
        {
          $set: {
            status: 'VOID',
            cancellationActor: 'SYSTEM',
            cancellationCategory: 'REQUEST_EXPIRED',
            cancelledAt: new Date(),
          },
        },
        { session }
      );

      await session.commitTransaction();

      await auditService.log({
        actor: { type: 'SYSTEM' },
        action: auditService.ACTIONS.REQUEST_EXPIRED,
        entityType: 'Request',
        entityId: request._id,
        metadata: { requestedBy: request.requiredBy },
      });

      const donors = voidedPledges.map((p) => p.donor).filter(Boolean);
      notificationService.requestExpiredOrCancelled(request, donors).catch(() => {});
    } catch (err) {
      await session.abortTransaction();
      console.error(`[expiry-job] Failed to expire request ${request._id}:`, err.message);
    } finally {
      session.endSession();
    }
  }

  console.log(`[expiry-job] Expired ${expirableRequests.length} request(s)`);
};

const start = () => {
  // Runs every 15 minutes
  cron.schedule('*/15 * * * *', () => {
    runExpiry().catch((err) => console.error('[expiry-job] Unhandled error:', err.message));
  });
  console.log('[expiry-job] Scheduled — runs every 15 minutes');
};

module.exports = { start, runExpiry };
