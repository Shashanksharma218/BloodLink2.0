const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const Model = decoded.role === 'hospital' ? Hospital : User;
    const account = await Model.findById(decoded.id).select('-password');

    if (!account) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }

    req.user = account;
    req.role = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

const userOnly = (req, res, next) => {
  if (req.role !== 'user') {
    return res.status(403).json({ message: 'Access denied: users only' });
  }
  next();
};

const hospitalOnly = (req, res, next) => {
  if (req.role !== 'hospital') {
    return res.status(403).json({ message: 'Access denied: hospitals only' });
  }
  next();
};

// Soft email-verification gate. `protect` must run first.
// Returns 403 with a stable code so the frontend can prompt to verify.
const requireVerifiedEmail = (req, res, next) => {
  if (!req.user?.emailVerified) {
    return res.status(403).json({
      message: 'Please verify your email address before continuing.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};

module.exports = { protect, userOnly, hospitalOnly, requireVerifiedEmail };
