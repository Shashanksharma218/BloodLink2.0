const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const { generateToken, cookieOptions } = require('../utils/generateToken');
const { computeEffectiveStatus, daysUntilAvailable, availableOnDate } = require('../utils/donorStatus');

const sanitize = (doc, role) => {
  const obj = doc.toObject();
  delete obj.password;
  obj.role = role;
  if (role === 'user') {
    obj.effectiveStatus = computeEffectiveStatus(obj);
    obj.daysUntilAvailable = daysUntilAvailable(obj);
    obj.availableOn = availableOnDate(obj);
  }
  return obj;
};

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

    const Model = role === 'hospital' ? Hospital : User;

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

    const Model = role === 'hospital' ? Hospital : User;
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
  return res.json({ user: sanitize(req.user, req.role) });
};

module.exports = { register, login, logout, me };
