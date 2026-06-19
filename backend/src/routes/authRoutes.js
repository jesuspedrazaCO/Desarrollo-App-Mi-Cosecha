const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { register, login, getMe, updateMe } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('El nombre es obligatorio')
      .isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),
    body('email').trim().isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('farmName').optional().trim().isLength({ max: 100 }).withMessage('El nombre de la finca es demasiado largo'),
    body('phone').optional().trim().isLength({ max: 20 }).withMessage('El teléfono no es válido'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').trim().isEmail().withMessage('Correo electrónico inválido').normalizeEmail(),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  validate,
  login
);

router.get('/me', protect, getMe);

router.put(
  '/me',
  protect,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('password').optional().isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('phone').optional().trim().isLength({ max: 20 }),
  ],
  validate,
  updateMe
);

module.exports = router;
