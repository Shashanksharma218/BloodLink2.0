const authService = require('./auth.service');
const { serialize } = require('./auth.serializers');
const { generateToken, cookieOptions } = require('../../utils/generateToken');
const auditService = require('../audit/audit.service');
const asyncHandler = require('../../utils/asyncHandler');
const { ok, created } = require('../../utils/respond');

const register = asyncHandler(async (req, res) => {
  const { accountType } = req.body;
  const account = await authService.register(req.body);

  const token = generateToken({ id: account._id, accountType });
  res.cookie('token', token, cookieOptions);

  await auditService.log({
    actor: { type: accountType === 'hospital' ? 'HOSPITAL' : 'USER', id: account._id },
    action: auditService.ACTIONS.AUTH_REGISTER,
    entityType: accountType === 'hospital' ? 'Hospital' : 'User',
    entityId: account._id,
    req,
  });

  return created(res, { account: serialize(account, accountType) });
});

const login = asyncHandler(async (req, res) => {
  const { accountType, email, password } = req.body;

  let account;
  try {
    account = await authService.login({ accountType, email, password });
  } catch (err) {
    await auditService.log({
      actor: { type: 'SYSTEM' },
      action: auditService.ACTIONS.AUTH_FAILED,
      entityType: accountType === 'hospital' ? 'Hospital' : 'User',
      entityId: account?._id || '000000000000000000000000',
      metadata: { email, reason: err.message },
      req,
    });
    throw err;
  }

  const token = generateToken({ id: account._id, accountType });
  res.cookie('token', token, cookieOptions);

  await auditService.log({
    actor: { type: accountType === 'hospital' ? 'HOSPITAL' : 'USER', id: account._id },
    action: auditService.ACTIONS.AUTH_LOGIN,
    entityType: accountType === 'hospital' ? 'Hospital' : 'User',
    entityId: account._id,
    req,
  });

  return ok(res, { account: serialize(account, accountType) });
});

const logout = asyncHandler(async (req, res) => {
  if (req.actor) {
    await auditService.log({
      actor: { type: req.actor.accountType === 'hospital' ? 'HOSPITAL' : 'USER', id: req.actor.id },
      action: auditService.ACTIONS.AUTH_LOGOUT,
      entityType: req.actor.accountType === 'hospital' ? 'Hospital' : 'User',
      entityId: req.actor.id,
      req,
    });
  }
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  return res.status(204).send();
});

const me = asyncHandler(async (req, res) => {
  return ok(res, { account: serialize(req.account, req.actor.accountType) });
});

const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword({
    account: req.account,
    currentPassword: req.body.current,
    newPassword: req.body.next,
  });
  return ok(res, { message: 'Password updated' });
});

module.exports = { register, login, logout, me, changePassword };
