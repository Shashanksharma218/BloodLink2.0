const express = require('express');
const controller = require('./request.controller');
const authenticate = require('../../middleware/authenticate');
const authorize = require('../../middleware/authorize');
const validate = require('../../middleware/validate');
const upload = require('../../middleware/upload');
const limiter = require('../../middleware/rateLimit');
const { createRequestSchema, cancelRequestSchema, idParamSchema } = require('./request.validators');

const router = express.Router();

router.use(authenticate);

// Donor feed
router.get('/feed', authorize('donor'), controller.getDonorFeed);

// Seeker routes
router.post('/',
  authorize('seeker'),
  limiter.createRequest,
  upload.single('proofDocument'),
  validate(createRequestSchema),
  controller.create
);
router.get('/',        authorize('seeker'), controller.list);
router.get('/:id',     controller.getOne);   // ownership check inside service
router.patch('/:id/cancel', authorize('seeker'), validate(cancelRequestSchema), controller.cancel);
router.get('/:id/pledges',  authorize('seeker'), controller.getPledges);

module.exports = router;
