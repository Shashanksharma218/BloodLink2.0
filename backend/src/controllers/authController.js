const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { generateToken, cookieOptions } = require('../utils/generateToken');
const { computeEffectiveStatus, daysUntilAvailable, availableOnDate } = require('../utils/donorStatus');
const emailClient = require('../services/emailClient');

const VERIFY_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;       // 1 hour

const sanitize = (doc, role) => {
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj.password;
  delete obj.emailVerifyTokenHash;
  delete obj.emailVerifyExpires;
  delete obj.passwordResetTokenHash;
  delete obj.passwordResetExpires;
  obj.role = role;
  if (role === 'user') {
    obj.effectiveStatus = computeEffectiveStatus(obj);
    obj.daysUntilAvailable = daysUntilAvailable(obj);
    obj.availableOn = availableOnDate(obj);
  }
  return obj;
};

const hashToken = (raw) => crypto.createHash('sha256').update(raw).digest('hex');

const buildAppUrl = (path) => {
  const base = (process.env.APP_PUBLIC_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}${path}`;
};

const modelForRole = (role) => (role === 'hospital' ? Hospital : User);

const requestIp = (req) =>
  (req.headers['x-forwarded-for']?.split(',')[0]?.trim()) || req.ip || req.socket?.remoteAddress;

async function issueVerificationEmail(account, role) {
  const rawToken = crypto.randomBytes(32).toString('hex');
  account.emailVerifyTokenHash = hashToken(rawToken);
  account.emailVerifyExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
  await account.save();

  const verifyUrl = buildAppUrl(`/verify-email?token=${rawToken}&role=${role}`);
  await emailClient.sendVerifyEmail({
    to: account.email,
    name: account.name,
    verifyUrl,
  });
}

const register = async (req, res) => {
  try {
    const { role, name, email, password, phone, pincode, bloodGroup, address, donorEnrolled } = req.body;

    if (!role || !['user', 'hospital'].includes(role)) {
      return res.status(400).json({ message: 'Valid role is required (user or hospital)' });
    }
    if (!name || !email || !password || !pincode) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (role === 'user' && !bloodGroup) {
      return res.status(400).json({ message: 'Blood group is required for donors' });
    }

    const Model = modelForRole(role);

    const existing = await Model.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const payload =
      role === 'hospital'
        ? { name, email, password: hashed, phone, pincode, address }
        : {
            name, email, password: hashed, phone, pincode, bloodGroup,
            ...(typeof donorEnrolled === 'boolean' && { donorEnrolled }),
          };

    const account = await Model.create(payload);

    await issueVerificationEmail(account, role);

    const token = generateToken({ id: account._id, role });
    res.cookie('token', token, cookieOptions);

    return res.status(201).json({ user: sanitize(account, role) });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: err.message || 'Registration failed' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password, and role are required' });
    }
    if (!['user', 'hospital'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const Model = modelForRole(role);
    const account = await Model.findOne({ email: email.toLowerCase() });

    if (!account) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, account.password);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken({ id: account._id, role });
    res.cookie('token', token, cookieOptions);

    // Fire-and-forget login alert.
    emailClient.sendLoginAlert({
      to: account.email,
      name: account.name,
      ip: requestIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      when: new Date().toUTCString(),
    });

    return res.json({ user: sanitize(account, role) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Login failed' });
  }
};

const logout = async (req, res) => {
  res.clearCookie('token', { ...cookieOptions, maxAge: 0 });
  return res.json({ message: 'Logged out' });
};

const me = async (req, res) => {
  if (!req.user) return res.json({ user: null });
  return res.json({ user: sanitize(req.user, req.role) });
};

const verifyEmail = async (req, res) => {
  try {
    const { token, role } = req.query;
    if (!token || !role || !['user', 'hospital'].includes(role)) {
      return res.status(400).json({ message: 'Invalid verification link' });
    }

    const Model = modelForRole(role);
    const tokenHash = hashToken(String(token));

    const account = await Model.findOne({
      emailVerifyTokenHash: tokenHash,
      emailVerifyExpires: { $gt: new Date() },
    }).select('+emailVerifyTokenHash +emailVerifyExpires');

    if (!account) {
      return res.status(400).json({ message: 'Verification link is invalid or has expired' });
    }

    account.emailVerified = true;
    account.emailVerifyTokenHash = undefined;
    account.emailVerifyExpires = undefined;
    await account.save();

    emailClient.sendWelcome({ to: account.email, name: account.name });

    return res.json({ message: 'Email verified' });
  } catch (err) {
    console.error('verifyEmail error:', err);
    return res.status(500).json({ message: 'Failed to verify email' });
  }
};

const resendVerification = async (req, res) => {
  try {
    if (req.user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    await issueVerificationEmail(req.user, req.role);
    return res.json({ message: 'Verification email sent' });
  } catch (err) {
    console.error('resendVerification error:', err);
    return res.status(500).json({ message: 'Failed to resend verification email' });
  }
};

const changePassword = async (req, res) => {
  try {
    const { current, next } = req.body || {};
    if (!current || !next) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (String(next).length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    const Model = modelForRole(req.role);
    const account = await Model.findById(req.user._id).select('+password');
    if (!account) return res.status(404).json({ message: 'Account not found' });

    const valid = await bcrypt.compare(current, account.password);
    if (!valid) return res.status(401).json({ message: 'Current password is incorrect' });

    account.password = await bcrypt.hash(next, 10);
    account.passwordResetTokenHash = undefined;
    account.passwordResetExpires = undefined;
    await account.save();

    emailClient.sendPasswordChanged({
      to: account.email,
      name: account.name,
      when: new Date().toUTCString(),
    });

    return res.json({ message: 'Password changed' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ message: 'Failed to change password' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email, role } = req.body || {};
    // Always return success to avoid leaking which emails exist.
    const ack = { message: 'If an account exists for that email, a reset link has been sent.' };

    if (!email || !role || !['user', 'hospital'].includes(role)) return res.json(ack);

    const Model = modelForRole(role);
    const account = await Model.findOne({ email: String(email).toLowerCase() });
    if (!account) return res.json(ack);

    const rawToken = crypto.randomBytes(32).toString('hex');
    account.passwordResetTokenHash = hashToken(rawToken);
    account.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await account.save();

    const resetUrl = buildAppUrl(`/reset-password?token=${rawToken}&role=${role}`);
    emailClient.sendPasswordReset({
      to: account.email,
      name: account.name,
      resetUrl,
    });

    return res.json(ack);
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ message: 'Failed to process reset request' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, role, password } = req.body || {};
    if (!token || !role || !['user', 'hospital'].includes(role) || !password) {
      return res.status(400).json({ message: 'Invalid reset request' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const Model = modelForRole(role);
    const account = await Model.findOne({
      passwordResetTokenHash: hashToken(String(token)),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetTokenHash +passwordResetExpires');

    if (!account) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    account.password = await bcrypt.hash(password, 10);
    account.passwordResetTokenHash = undefined;
    account.passwordResetExpires = undefined;
    await account.save();

    emailClient.sendPasswordChanged({
      to: account.email,
      name: account.name,
      when: new Date().toUTCString(),
    });

    return res.json({ message: 'Password reset' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: 'Failed to reset password' });
  }
};

module.exports = {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  changePassword,
  forgotPassword,
  resetPassword,
};
