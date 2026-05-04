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

module.exports = { protect };
