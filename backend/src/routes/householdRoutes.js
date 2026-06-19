const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getHouseholdExpenses,
  createHouseholdExpense,
  updateHouseholdExpense,
  deleteHouseholdExpense,
} = require('../controllers/householdController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { validate } = require('../middlewares/validate');
const { HOUSEHOLD_CATEGORIES, PAYMENT_METHODS } = require('../models/HouseholdExpense');

router.use(protect);
router.use(normalizeDateFields(['date']));

const householdValidation = [
  body('date').notEmpty().withMessage('La fecha es obligatoria').isISO8601().withMessage('Fecha inválida'),
  body('category').notEmpty().withMessage('La categoría es obligatoria')
    .isIn(HOUSEHOLD_CATEGORIES).withMessage('Categoría inválida'),
  body('description').trim().notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ max: 200 }).withMessage('La descripción es demasiado larga'),
  body('amount').notEmpty().withMessage('El valor es obligatorio')
    .isFloat({ min: 0 }).withMessage('El valor debe ser un número positivo'),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Método de pago inválido'),
  body('observations').optional().trim().isLength({ max: 500 }).withMessage('Las observaciones son demasiado largas'),
];

router.get('/', getHouseholdExpenses);
router.post('/', householdValidation, validate, createHouseholdExpense);
router.put('/:id', householdValidation, validate, updateHouseholdExpense);
router.delete('/:id', deleteHouseholdExpense);

module.exports = router;
