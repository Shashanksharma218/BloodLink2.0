const ApiError = require('../utils/ApiError');

const authorize = (...allowedRoles) => (req, res, next) => {
  const roles = req.actor?.roles || [];
  const hasRole = allowedRoles.some((r) => roles.includes(r));
  if (!hasRole) return next(ApiError.forbidden());
  next();
};

module.exports = authorize;
