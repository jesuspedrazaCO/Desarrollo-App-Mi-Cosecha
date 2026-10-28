const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updateMe, updateAvatar, forgotPassword, resetPassword, updateLocation } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');
const { passwordRules } = require('../utils/passwordPolicy');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ min: 2, max: 80 }),
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  passwordRules('password'),
], validate, register);

router.post('/login', [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
], validate, login);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);
router.put('/location', protect, updateLocation);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
], validate, forgotPassword);

router.post('/reset-password/:token', [
  passwordRules('password'),
], validate, resetPassword);

module.exports = router;