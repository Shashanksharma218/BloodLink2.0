const express = require('express');
const {
  listStates,
  listDistricts,
  listBloodGroups,
  listComponents,
  getAvailability,
} = require('../controllers/eraktkoshController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All eRaktKosh routes require an authenticated account (user or hospital).
router.use(protect);

router.get('/states', listStates);
router.get('/states/:stateCode/districts', listDistricts);
router.get('/blood-groups', listBloodGroups);
router.get('/components', listComponents);
router.get('/availability', getAvailability);

module.exports = router;
