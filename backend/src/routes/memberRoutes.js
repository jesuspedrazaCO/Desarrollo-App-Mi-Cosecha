const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  listMembers, inviteMember, revokeInvitation, setMemberActive, removeMember,
} = require('../controllers/memberController');
const { protect, adminOnly } = require('../middlewares/authMiddleware');
const { validate } = require('../middlewares/validate');

// Todo aquí es solo para el administrador de la finca
router.use(protect, adminOnly);

router.get('/', listMembers);

router.post('/invite', [
  body('name').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ min: 2, max: 80 }).withMessage('El nombre debe tener entre 2 y 80 caracteres'),
  body('email').isEmail().withMessage('Correo inválido').normalizeEmail(),
], validate, inviteMember);

router.delete('/invitations/:id', param('id').isMongoId().withMessage('Invitación inválida'), validate, revokeInvitation);

router.patch('/:id', [
  param('id').isMongoId().withMessage('Miembro inválido'),
  body('active').isBoolean().withMessage('Valor inválido'),
], validate, setMemberActive);

router.delete('/:id', param('id').isMongoId().withMessage('Miembro inválido'), validate, removeMember);

module.exports = router;