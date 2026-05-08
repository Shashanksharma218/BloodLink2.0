const express = require('express');
const controller = require('./pledge.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const limiter = require('../../middleware/rateLimit');
const { createPledgeSchema, cancelPledgeSchema } = require('./pledge.validators');

const router = express.Router();

router.use(authenticate);

// Accept a request (donor)
router.post('/requests/:id/pledges',
  authorize('donor'),
  limiter.createPledge,
  validate(createPledgeSchema),
  controller.accept
);

// View a specific pledge
router.get('/pledges/:id', controller.getById);

// Donor cancels their own pledge
router.patch('/pledges/:id/cancel',
  authorize('donor'),
  validate(cancelPledgeSchema),
  controller.cancel
);

module.exports = router;
