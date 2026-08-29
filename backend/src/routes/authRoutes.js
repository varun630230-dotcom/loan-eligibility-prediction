const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { registerSchema, loginSchema } = require('../validators/authValidator');
const validator = require('../middleware/validator');
const auth = require('../middleware/auth');

router.post('/register', validator(registerSchema), authController.register);
router.post('/login', validator(loginSchema), authController.login);
router.get('/me', auth, authController.getMe);

module.exports = router;
