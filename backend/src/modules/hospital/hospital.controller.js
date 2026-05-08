const hospitalService = require('./hospital.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, paginated } = require('../../utils/respond');

const getProfile = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.getProfile(req.actor.id);
  return ok(res, hospital);
});

const updateProfile = asyncHandler(async (req, res) => {
  const hospital = await hospitalService.updateProfile(req.actor.id, req.body);
  return ok(res, hospital);
});

const getQueue = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { requests, total } = await hospitalService.getQueue(req.actor.id, {
    status: req.query.status,
    page,
    limit,
  });
  return paginated(res, requests, { page, limit, total });
});

const verifyRequest = asyncHandler(async (req, res) => {
  const request = await hospitalService.verifyRequest(
    req.actor.id, req.params.id,
    { type: 'HOSPITAL', id: req.actor.id }, req
  );
  return ok(res, request);
});

const rejectRequest = asyncHandler(async (req, res) => {
  const request = await hospitalService.rejectRequest(
    req.actor.id, req.params.id, req.body,
    { type: 'HOSPITAL', id: req.actor.id }, req
  );
  return ok(res, request);
});

const getRequestPledges = asyncHandler(async (req, res) => {
  const pledges = await hospitalService.getRequestPledges(req.actor.id, req.params.id);
  return ok(res, pledges);
});

const markNoShow = asyncHandler(async (req, res) => {
  const pledge = await hospitalService.markNoShow(
    req.actor.id, req.params.id, req.body,
    { type: 'HOSPITAL', id: req.actor.id }, req
  );
  return ok(res, pledge);
});

module.exports = { getProfile, updateProfile, getQueue, verifyRequest, rejectRequest, getRequestPledges, markNoShow };
