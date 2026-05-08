const AuditLog = require('../../models/AuditLog');

const log = async ({ actor, action, entityType, entityId, metadata = {}, req }) => {
  try {
    await AuditLog.create({
      actorType: actor?.type || 'SYSTEM',
      actorId: actor?.id || null,
      actorRoles: actor?.roles || [],
      action,
      entityType,
      entityId,
      metadata,
      ip: req?.ip,
      ua: req?.headers?.['user-agent'],
      at: new Date(),
    });
  } catch (err) {
    // Audit failures must never break the main flow
    console.error('[audit] log failed:', err.message);
  }
};

const ACTIONS = {
  AUTH_LOGIN: 'AUTH_LOGIN',
  AUTH_LOGOUT: 'AUTH_LOGOUT',
  AUTH_REGISTER: 'AUTH_REGISTER',
  AUTH_FAILED: 'AUTH_FAILED',
  REQUEST_CREATED: 'REQUEST_CREATED',
  REQUEST_VERIFIED: 'REQUEST_VERIFIED',
  REQUEST_REJECTED: 'REQUEST_REJECTED',
  REQUEST_CANCELLED: 'REQUEST_CANCELLED',
  REQUEST_EXPIRED: 'REQUEST_EXPIRED',
  REQUEST_FULFILLED: 'REQUEST_FULFILLED',
  PLEDGE_CREATED: 'PLEDGE_CREATED',
  PLEDGE_CANCELLED: 'PLEDGE_CANCELLED',
  PLEDGE_NO_SHOW: 'PLEDGE_NO_SHOW',
  PLEDGE_FULFILLED: 'PLEDGE_FULFILLED',
  PLEDGE_VOIDED: 'PLEDGE_VOIDED',
  DONATION_RECORDED: 'DONATION_RECORDED',
  DONATION_VERIFIED: 'DONATION_VERIFIED',
  DONATION_REJECTED: 'DONATION_REJECTED',
  CERT_ISSUED: 'CERT_ISSUED',
  CERT_REVOKED: 'CERT_REVOKED',
  HOSPITAL_VERIFIED: 'HOSPITAL_VERIFIED',
  HOSPITAL_SUSPENDED: 'HOSPITAL_SUSPENDED',
  USER_PII_REVEALED: 'USER_PII_REVEALED',
};

module.exports = { log, ACTIONS };
