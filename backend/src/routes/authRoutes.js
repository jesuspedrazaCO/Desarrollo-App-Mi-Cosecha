const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { register, login, getMe, updateMe, updateAvatar, forgotPassword, resetPassword, updateLocation } = require('../controllers/authController');
const { getInvitation, acceptInvitation } = require('../controllers/memberController');
const { protect, protectSelf } = require('../middlewares/authMiddleware');
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

// Perfil propio: también lo pueden editar los lectores (solo su nombre, foto, teléfono y contraseña)
router.get('/me', protectSelf, getMe);
router.put('/me', protectSelf, updateMe);
router.put('/avatar', protectSelf, upload.single('avatar'), updateAvatar);
router.put('/location', protect, updateLocation);

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
], validate, forgotPassword);

router.post('/reset-password/:token', [
  passwordRules('password'),
], validate, resetPassword);

// Invitaciones a la finca (públicas: el token que llega por correo es la credencial)
const invitationToken = param('token').isHexadecimal().isLength({ min: 64, max: 64 }).withMessage('Invitación inválida');
router.get('/invitation/:token', invitationToken, validate, getInvitation);
router.post('/accept-invitation/:token', [invitationToken, passwordRules('password')], validate, acceptInvitation);

module.exports = router;