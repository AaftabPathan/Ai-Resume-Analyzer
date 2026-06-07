const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth.controller');

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/refresh', AuthController.refreshToken);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/oauth', AuthController.oauthLogin);

module.exports = router;
