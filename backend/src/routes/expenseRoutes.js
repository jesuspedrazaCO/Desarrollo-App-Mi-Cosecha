const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getExpenses, createExpense, updateExpense, deleteExpense } = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { validate } = require('../middlewares/validate');
const { EXPENSE_CATEGORIES, PAYMENT_METHODS } = require('../models/Expense');

router.use(protect);
router.use(normalizeDateFields(['date']));

const expenseValidation = [
  body('crop').notEmpty().withMessage('El cultivo es obligatorio').isMongoId().withMessage('Cultivo inválido'),
  body('date').notEmpty().withMessage('La fecha es obligatoria').isISO8601().withMessage('Fecha inválida'),
  body('description').trim().notEmpty().withMessage('La descripción es obligatoria')
    .isLength({ max: 200 }).withMessage('La descripción es demasiado larga'),
  body('category').notEmpty().withMessage('La categoría es obligatoria')
    .isIn(EXPENSE_CATEGORIES).withMessage('Categoría inválida'),
  body('amount').notEmpty().withMessage('El valor es obligatorio')
    .isFloat({ min: 0 }).withMessage('El valor debe ser un número positivo'),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS).withMessage('Método de pago inválido'),
  body('observations').optional().trim().isLength({ max: 500 }).withMessage('Las observaciones son demasiado largas'),
];

router.get('/', getExpenses);
router.post('/', expenseValidation, validate, createExpense);
router.put('/:id', expenseValidation, validate, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;
