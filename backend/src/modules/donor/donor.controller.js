const donorService = require('./donor.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, paginated } = require('../../utils/respond');

const getProfile = asyncHandler(async (req, res) => {
  return ok(res, donorService.getProfile(req.account));
});

const updateProfile = asyncHandler(async (req, res) => {
  const updated = await donorService.updateProfile(req.actor.id, req.body);
  return ok(res, donorService.getProfile(updated));
});

const getDonations = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { donations, total } = await donorService.getDonations(req.actor.id, { page, limit });
  return paginated(res, donations, { page, limit, total });
});

const getPledges = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { pledges, total } = await donorService.getPledges(req.actor.id, {
    status: req.query.status,
    page,
    limit,
  });
  return paginated(res, pledges, { page, limit, total });
});

const getCertificates = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const { certificates, total } = await donorService.getCertificates(req.actor.id, { page, limit });
  return paginated(res, certificates, { page, limit, total });
});

module.exports = { getProfile, updateProfile, getDonations, getPledges, getCertificates };
