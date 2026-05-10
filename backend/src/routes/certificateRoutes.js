const express = require('express');
const { downloadCertificate, verifyByPublicId } = require('../controllers/certificateController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Authenticated download — donor or owning hospital
router.get('/:id/download', protect, downloadCertificate);

// Public verification by verificationId — no auth
router.get('/verify/:verificationId', verifyByPublicId);

module.exports = router;
