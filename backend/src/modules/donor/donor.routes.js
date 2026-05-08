const express = require('express');
const controller = require('./donor.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { updateProfileSchema } = require('./donor.validators');

const router = express.Router();

router.use(authenticate, authorize('donor'));

router.get('/profile',      controller.getProfile);
router.patch('/profile',    validate(updateProfileSchema), controller.updateProfile);
router.get('/donations',    controller.getDonations);
router.get('/pledges',      controller.getPledges);
router.get('/certificates', controller.getCertificates);

module.exports = router;
