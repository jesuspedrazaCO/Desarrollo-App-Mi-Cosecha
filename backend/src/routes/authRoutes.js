const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updateMe, updateAvatar } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ min: 2, max: 80 }),
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
], validate, register);

router.post('/login', [
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
  body('password').notEmpty().withMessage('La contraseña es obligatoria'),
], validate, login);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/avatar', protect, upload.single('avatar'), updateAvatar);

module.exports = router;
