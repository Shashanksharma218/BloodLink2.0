const donationService = require('./donation.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginated } = require('../../utils/respond');

const record = asyncHandler(async (req, res) => {
  const donation = await donationService.record(
    req.actor.id, req.body,
    { type: 'HOSPITAL', id: req.actor.id }, req
  );
  return created(res, donation);
});

const verify = asyncHandler(async (req, res) => {
  const result = await donationService.verify(
    req.actor.id, req.params.id,
    { type: 'HOSPITAL', id: req.actor.id }, req
  );
  return ok(res, result);
});

const reject = asyncHandler(async (req, res) => {
  const donation = await donationService.reject(
    req.actor.id, req.params.id, req.body.reason,
    { type: 'HOSPITAL', id: req.actor.id }, req
  );
  return ok(res, donation);
});

const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { donations, total } = await donationService.listForHospital(req.actor.id, {
    state: req.query.state,
    page,
    limit,
  });
  return paginated(res, donations, { page, limit, total });
});

module.exports = { record, verify, reject, list };
