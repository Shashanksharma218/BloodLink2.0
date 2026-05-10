const express = require('express');
const path = require('path');
const multer = require('multer');
const {
  getDonorFeed,
  createRequest,
  getMyRequests,
  getRequest,
  cancelRequest,
  getRequestPledges,
  acceptPledge,
} = require('../controllers/requestController');
const { protect, userOnly, requireVerifiedEmail } = require('../middleware/auth');

const router = express.Router();
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});
const upload = multer({ storage });

router.use(protect, userOnly);

// /feed must come before /:id to avoid route conflict
router.get('/feed', getDonorFeed);

router.post('/', requireVerifiedEmail, upload.single('proof'), createRequest);
router.get('/', getMyRequests);
router.get('/:id', getRequest);
router.patch('/:id/cancel', cancelRequest);
router.get('/:id/pledges', getRequestPledges);
router.post('/:id/pledges', requireVerifiedEmail, acceptPledge);

module.exports = router;
