const express = require('express');
const { getPledge, cancelPledge } = require('../controllers/pledgeController');
const { protect, userOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, userOnly);

router.get('/:id', getPledge);
router.patch('/:id/cancel', cancelPledge);

module.exports = router;
