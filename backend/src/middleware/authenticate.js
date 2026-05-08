const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hospital = require('../models/Hospital');
const ApiError = require('../utils/ApiError');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return next(ApiError.unauthorized());

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const accountType = decoded.accountType || decoded.role;

    const Model = accountType === 'hospital' ? Hospital : User;
    const account = await Model.findById(decoded.id).select('-password');

    if (!account) return next(ApiError.unauthorized('Account no longer exists'));
    if (account.deletedAt) return next(ApiError.unauthorized('Account deactivated'));

    if (accountType === 'hospital' && account.state === 'SUSPENDED') {
      return next(ApiError.forbidden('Hospital account is suspended'));
    }

    req.account = account;
    req.actor = {
      id: account._id,
      accountType,
      roles: accountType === 'hospital' ? ['hospital'] : (account.roles || ['donor', 'seeker']),
    };
    next();
  } catch (err) {
    next(ApiError.unauthorized('Invalid or expired token'));
  }
};

module.exports = authenticate;
