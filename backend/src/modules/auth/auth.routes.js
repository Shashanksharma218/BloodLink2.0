const express = require('express');
const controller = require('./auth.controller');
const validate = require('../../middleware/validate');
const authenticate = require('../../middleware/authenticate');
const limiter = require('../../middleware/rateLimit');
const { registerSchema, loginSchema, changePasswordSchema } = require('./auth.validators');

const router = express.Router();

router.post('/register', limiter.authStrict, validate(registerSchema), controller.register);
router.post('/login',    limiter.authStrict, validate(loginSchema),    controller.login);
router.post('/logout',   authenticate,                                  controller.logout);
router.get('/me',        authenticate,                                  controller.me);
router.patch('/password', authenticate, validate(changePasswordSchema), controller.changePassword);

module.exports = router;
