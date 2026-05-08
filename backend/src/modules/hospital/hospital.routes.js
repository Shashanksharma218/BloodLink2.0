const express = require('express');
const controller = require('./hospital.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const {
  updateProfileSchema,
  verifyRequestSchema,
  rejectRequestSchema,
  noShowSchema,
} = require('./hospital.validators');

const router = express.Router();

router.use(authenticate, authorize('hospital'));

router.get('/profile',  controller.getProfile);
router.patch('/profile', validate(updateProfileSchema), controller.updateProfile);

router.get('/requests',                 controller.getQueue);
router.patch('/requests/:id/verify',    validate(verifyRequestSchema), controller.verifyRequest);
router.patch('/requests/:id/reject',    validate(rejectRequestSchema), controller.rejectRequest);
router.get('/requests/:id/pledges',     controller.getRequestPledges);

router.patch('/pledges/:id/no-show',    validate(noShowSchema), controller.markNoShow);

module.exports = router;
