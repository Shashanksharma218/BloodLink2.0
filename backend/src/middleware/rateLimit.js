const rateLimit = require('express-rate-limit');

const make = (max, windowMin, message = 'Too many requests') =>
  rateLimit({
    windowMs: windowMin * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).json({ success: false, error: { code: 'RATE_LIMITED', message } }),
  });

module.exports = {
  global: make(200, 1),
  authStrict: make(5, 15, 'Too many auth attempts, try again in 15 minutes'),
  createRequest: make(5, 60, 'Too many requests created, try again later'),
  createPledge: make(10, 60),
  verifyPublic: make(30, 1),
};
