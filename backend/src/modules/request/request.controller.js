const requestService = require('./request.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created, paginated } = require('../../utils/respond');

const create = asyncHandler(async (req, res) => {
  const proofPath = req.file ? req.file.path : null;
  const request = await requestService.create(
    req.actor.id,
    req.account.phone,
    req.body,
    proofPath,
    { type: 'USER', id: req.actor.id, roles: req.actor.roles },
    req
  );
  return created(res, request);
});

const list = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { requests, total } = await requestService.listForSeeker(req.actor.id, {
    status: req.query.status,
    page,
    limit,
  });
  return paginated(res, requests, { page, limit, total });
});

const getOne = asyncHandler(async (req, res) => {
  const request = await requestService.getById(req.params.id, req.actor);
  return ok(res, request);
});

const cancel = asyncHandler(async (req, res) => {
  const request = await requestService.cancel(
    req.actor.id, req.params.id, req.body.reason,
    { type: 'USER', id: req.actor.id }, req
  );
  return ok(res, request);
});

const getPledges = asyncHandler(async (req, res) => {
  const pledges = await requestService.getPledgesForSeeker(req.actor.id, req.params.id);
  return ok(res, pledges);
});

const getDonorFeed = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { requests, total } = await requestService.getFeedForDonor(req.account, { page, limit });
  return paginated(res, requests, { page, limit, total });
});

module.exports = { create, list, getOne, cancel, getPledges, getDonorFeed };
