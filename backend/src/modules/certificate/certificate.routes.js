const express = require('express');
const controller = require('./certificate.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const limiter = require('../../middleware/rateLimit');

const router = express.Router();

// Authenticated download (donor only)
router.get('/:id/download', authenticate, authorize('donor'), controller.download);

module.exports = router;
