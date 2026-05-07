const express = require('express');
const { getDonorStatus, toggleAvailability } = require('../controllers/donorController');
const { protect, userOnly } = require('../middleware/auth');

const router = express.Router();

// All donor routes require an authenticated user account.
router.use(protect, userOnly);

router.get('/status', getDonorStatus);
router.put('/availability', toggleAvailability);

module.exports = router;
