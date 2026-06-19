const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getIncomes, createIncome, updateIncome, deleteIncome } = require('../controllers/incomeController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { validate } = require('../middlewares/validate');

router.use(protect);
router.use(normalizeDateFields(['date']));

const incomeValidation = [
  body('crop').notEmpty().withMessage('El cultivo es obligatorio').isMongoId().withMessage('Cultivo inválido'),
  body('date').notEmpty().withMessage('La fecha es obligatoria').isISO8601().withMessage('Fecha inválida'),
  body('type').optional().isIn(['venta_cosecha', 'venta_parcial', 'otro']).withMessage('Tipo de ingreso inválido'),
  body('client').optional().trim().isLength({ max: 100 }).withMessage('El nombre del cliente es demasiado largo'),
  body('quantitySold').optional().isFloat({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('salePrice').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('El valor total debe ser un número positivo'),
  body('observations').optional().trim().isLength({ max: 500 }).withMessage('Las observaciones son demasiado largas'),
];

router.get('/', getIncomes);
router.post('/', incomeValidation, validate, createIncome);
router.put('/:id', incomeValidation, validate, updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;
