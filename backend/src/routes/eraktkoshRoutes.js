const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  listStates,
  listDistricts,
  listBloodGroups,
  listComponents,
  getAvailability,
} = require('../controllers/eraktkoshController');

const router = express.Router();

const eraktkoshLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

router.use(eraktkoshLimiter);

router.get('/states', listStates);
router.get('/states/:stateCode/districts', listDistricts);
router.get('/blood-groups', listBloodGroups);
router.get('/components', listComponents);
router.get('/availability', getAvailability);

module.exports = router;
