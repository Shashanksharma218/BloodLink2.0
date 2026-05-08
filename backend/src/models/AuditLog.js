const mongoose = require('mongoose');

const AUDIT_ACTIONS = [
  'AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_REGISTER', 'AUTH_FAILED',
  'REQUEST_CREATED', 'REQUEST_VERIFIED', 'REQUEST_REJECTED',
  'REQUEST_CANCELLED', 'REQUEST_EXPIRED', 'REQUEST_FULFILLED',
  'PLEDGE_CREATED', 'PLEDGE_CANCELLED', 'PLEDGE_NO_SHOW',
  'PLEDGE_FULFILLED', 'PLEDGE_VOIDED',
  'DONATION_RECORDED', 'DONATION_VERIFIED', 'DONATION_REJECTED',
  'CERT_ISSUED', 'CERT_REVOKED',
  'HOSPITAL_VERIFIED', 'HOSPITAL_SUSPENDED',
  'USER_PII_REVEALED',
];

const auditLogSchema = new mongoose.Schema(
  {
    actorType: {
      type: String,
      enum: ['USER', 'HOSPITAL', 'SYSTEM'],
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    actorRoles: {
      type: [String],
    },
    action: {
      type: String,
      enum: AUDIT_ACTIONS,
      required: true,
    },
    entityType: {
      type: String,
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ip: String,
    ua: String,
    at: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: false }
);

auditLogSchema.index({ entityType: 1, entityId: 1, at: -1 });
auditLogSchema.index({ actorType: 1, actorId: 1, at: -1 });
auditLogSchema.index({ action: 1, at: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
