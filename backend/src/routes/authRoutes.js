const express = require('express');
const {
  register,
  login,
  logout,
  me,
  verifyEmail,
  resendVerification,
  changePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect, softProtect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', softProtect, me);

router.get('/verify-email', verifyEmail);
router.post('/resend-verification', protect, resendVerification);

router.patch('/password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
