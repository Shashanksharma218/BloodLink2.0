const express = require('express');
const { searchHospitals } = require('../controllers/hospitalController');
const {
  getHospitalProfile,
  updateHospitalProfile,
  getHospitalRequests,
  verifyRequest,
  rejectRequest,
  getRequestPledges,
  markNoShow,
  getHospitalDonations,
  recordDonation,
  verifyDonation,
  rejectDonation,
} = require('../controllers/hospitalDashboardController');
const { protect, hospitalOnly, requireVerifiedEmail } = require('../middleware/auth');

const router = express.Router();

// Public: search hospitals (used by seekers when creating requests)
// Mounted at both /api/hospitals (GET /) and /api/hospital/search
router.get('/', searchHospitals);
router.get('/search', searchHospitals);

// Hospital dashboard routes (authenticated, hospital role only)
router.use(protect, hospitalOnly);

router.get('/profile', getHospitalProfile);
router.patch('/profile', updateHospitalProfile);

router.get('/requests', getHospitalRequests);
router.patch('/requests/:id/verify', verifyRequest);
router.patch('/requests/:id/reject', rejectRequest);
router.get('/requests/:id/pledges', getRequestPledges);

router.patch('/pledges/:pledgeId/no-show', markNoShow);

router.get('/donations', getHospitalDonations);
router.post('/donations', requireVerifiedEmail, recordDonation);
router.patch('/donations/:id/verify', requireVerifiedEmail, verifyDonation);
router.patch('/donations/:id/reject', rejectDonation);

module.exports = router;
