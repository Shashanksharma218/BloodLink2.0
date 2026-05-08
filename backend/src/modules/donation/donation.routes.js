const express = require('express');
const controller = require('./donation.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const { recordDonationSchema, rejectDonationSchema, idParamSchema } = require('./donation.validators');

const router = express.Router();

router.use(authenticate, authorize('hospital'));

router.get('/',              controller.list);
router.post('/',             validate(recordDonationSchema), controller.record);
router.patch('/:id/verify',  validate(idParamSchema),        controller.verify);
router.patch('/:id/reject',  validate(rejectDonationSchema), controller.reject);

module.exports = router;
