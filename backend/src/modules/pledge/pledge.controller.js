const pledgeService = require('./pledge.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/respond');

const accept = asyncHandler(async (req, res) => {
  const pledge = await pledgeService.accept(
    req.account,
    req.params.id,
    { type: 'USER', id: req.actor.id, roles: req.actor.roles },
    req
  );
  return created(res, pledge);
});

const cancel = asyncHandler(async (req, res) => {
  const pledge = await pledgeService.cancel(
    req.actor.id, req.params.id, req.body,
    { type: 'USER', id: req.actor.id }, req
  );
  return ok(res, pledge);
});

const getById = asyncHandler(async (req, res) => {
  const pledge = await pledgeService.getById(req.params.id, req.actor);
  return ok(res, pledge);
});

module.exports = { accept, cancel, getById };
