const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getIncomes, createIncome, updateIncome, deleteIncome, mergeIncomes } = require('../controllers/incomeController');
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

  body('items').optional().isArray({ min: 1 }).withMessage('Agrega al menos un producto vendido'),
  body('items.*.variety').trim().notEmpty().withMessage('La variedad es obligatoria').isLength({ max: 100 }).withMessage('El nombre de la variedad es demasiado largo'),
  body('items.*.quantitySold').isFloat({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('items.*.unit').optional().trim().isLength({ max: 20 }).withMessage('La unidad es demasiado larga'),
  body('items.*.crates').optional().isFloat({ min: 0 }).withMessage('Las canastillas deben ser un número positivo'),
  body('items.*.salePrice').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),

  body('quantitySold').optional().isFloat({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('salePrice').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('totalAmount').optional().isFloat({ min: 0 }).withMessage('El valor total debe ser un número positivo'),

  body('observations').optional().trim().isLength({ max: 500 }).withMessage('Las observaciones son demasiado largas'),
];

const mergeValidation = [
  body('ids').isArray({ min: 2 }).withMessage('Selecciona al menos dos ingresos para agrupar'),
  body('ids.*').isMongoId().withMessage('ID de ingreso inválido'),
  body('crop').notEmpty().withMessage('El cultivo es obligatorio').isMongoId().withMessage('Cultivo inválido'),
  body('items').optional().isArray({ min: 1 }).withMessage('Agrega al menos un producto vendido'),
  body('items.*.variety').optional().trim().notEmpty().withMessage('La variedad es obligatoria').isLength({ max: 100 }).withMessage('El nombre de la variedad es demasiado largo'),
  body('items.*.quantitySold').optional().isFloat({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('items.*.salePrice').optional().isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
];

router.get('/', getIncomes);
router.post('/', incomeValidation, validate, createIncome);
router.post('/merge', mergeValidation, validate, mergeIncomes);
router.put('/:id', incomeValidation, validate, updateIncome);
router.delete('/:id', deleteIncome);

module.exports = router;