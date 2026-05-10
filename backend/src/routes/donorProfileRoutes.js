const express = require('express');
const {
  getDonorProfile,
  updateDonorProfile,
  getDonorDonations,
  getDonorPledges,
  getDonorCertificates,
} = require('../controllers/donorProfileController');
const { protect, userOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect, userOnly);

router.get('/profile', getDonorProfile);
router.patch('/profile', updateDonorProfile);
router.get('/donations', getDonorDonations);
router.get('/pledges', getDonorPledges);
router.get('/certificates', getDonorCertificates);

module.exports = router;
