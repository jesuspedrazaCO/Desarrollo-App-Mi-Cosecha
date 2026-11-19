const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const {
  getExpenses, createExpense, updateExpense, deleteExpense,
  getPendingExpenses, createPendingOrder, payExpense, payOrder,
  addItemsToOrder, updatePendingOrder, deletePendingOrder, updatePendingLine, deletePendingLine, payLine,
} = require('../controllers/expenseController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { validate } = require('../middlewares/validate');
const { EXPENSE_CATEGORIES, PAYMENT_METHODS } = require('../models/Expense');

router.use(protect);
router.use(normalizeDateFields(['date', 'dueDate', 'paidAt']));

// Una compra se identifica con un UUID (orderId) o, en compras viejas, con el id del producto
const isOrderKey = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(v)) ||
  /^[a-f\d]{24}$/i.test(String(v));

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
  body('payers').optional().isArray().withMessage('El formato de aportantes es inválido'),
  body('payers.*.contributor').optional().isMongoId().withMessage('Aportante inválido'),
  body('payers.*.amount').optional().isFloat({ min: 0 }).withMessage('El monto del aportante debe ser un número positivo'),
  // Opcional: de qué cultivo salió la plata con la que se pagó este gasto.
  // Acepta vacío/null (significa "no aplica") además de un ID válido.
  body('fundedByCrop').optional({ checkFalsy: true }).isMongoId().withMessage('Cultivo de origen inválido'),
];

// Campos de un producto de compra por pagar. El valor puede venir como "amount" (compra sencilla)
// o como cantidad + precio unitario; el total lo recalcula siempre el servidor.
const itemFieldsValidation = (prefix) => [
  body(`${prefix}crop`).optional({ checkFalsy: true }).isMongoId().withMessage('Cultivo inválido'),
  body(`${prefix}description`).trim().notEmpty().withMessage('Cada producto necesita una descripción')
    .isLength({ max: 200 }).withMessage('La descripción es demasiado larga'),
  body(`${prefix}category`).isIn(EXPENSE_CATEGORIES).withMessage('Categoría inválida'),
  body(`${prefix}quantity`).optional({ checkFalsy: true })
    .isFloat({ gt: 0, max: 1000000 }).withMessage('La cantidad debe ser mayor a 0'),
  body(`${prefix}unit`).optional({ checkFalsy: true }).isString().trim()
    .isLength({ max: 20 }).withMessage('La unidad es demasiado larga'),
  body(`${prefix}unitPrice`).optional({ checkFalsy: true })
    .isFloat({ gt: 0, max: 10000000000 }).withMessage('El precio unitario debe ser mayor a 0'),
  // Reparto del producto entre cultivos: [{ crop, quantity }]
  body(`${prefix}allocations`).optional().isArray({ max: 20 }).withMessage('El reparto por cultivos es inválido'),
  body(`${prefix}allocations.*.crop`).optional({ checkFalsy: true }).isMongoId().withMessage('Cultivo inválido'),
  body(`${prefix}allocations.*.quantity`).isFloat({ gt: 0, max: 1000000 }).withMessage('La cantidad de cada cultivo debe ser mayor a 0'),
  body(`${prefix}amount`).optional({ checkFalsy: true })
    .isFloat({ gt: 0, max: 10000000000 }).withMessage('El valor de cada producto debe ser mayor a 0'),
];

// Cada producto debe traer (cantidad y precio unitario), un reparto con precio unitario, o un valor total
const hasValue = (i) => {
  if (Array.isArray(i?.allocations) && i.allocations.length > 0) {
    return Number(i.unitPrice) > 0 && i.allocations.every((a) => Number(a?.quantity) > 0);
  }
  return (Number(i?.quantity) > 0 && Number(i?.unitPrice) > 0) || Number(i?.amount) > 0;
};

// Compra por pagar: varios productos de un mismo proveedor, cada uno con su cultivo y categoría
const pendingOrderValidation = [
  body('date').notEmpty().withMessage('La fecha es obligatoria').isISO8601().withMessage('Fecha inválida'),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha límite inválida'),
  body('supplier').optional().trim().isLength({ max: 100 }).withMessage('El nombre del proveedor es demasiado largo'),
  body('observations').optional().trim().isLength({ max: 500 }).withMessage('Las observaciones son demasiado largas'),
  body('items').isArray({ min: 1, max: 50 }).withMessage('Agrega al menos un producto'),
  ...itemFieldsValidation('items.*.'),
  body('items').custom((items) => Array.isArray(items) && items.every(hasValue))
    .withMessage('Cada producto necesita cantidad y precio unitario'),
];

// Agregar productos a una compra existente
const addItemsValidation = [
  param('orderId').custom(isOrderKey).withMessage('Compra inválida'),
  body('items').isArray({ min: 1, max: 50 }).withMessage('Agrega al menos un producto'),
  ...itemFieldsValidation('items.*.'),
  body('items').custom((items) => Array.isArray(items) && items.every(hasValue))
    .withMessage('Cada producto necesita cantidad y precio unitario'),
];

// Editar un solo producto (con su reparto entre cultivos)
const lineUpdateValidation = [
  param('lineKey').custom(isOrderKey).withMessage('Producto inválido'),
  ...itemFieldsValidation(''),
  body().custom(hasValue).withMessage('El producto necesita cantidad y precio unitario'),
];

// Editar datos generales de la compra
const orderUpdateValidation = [
  param('orderId').custom(isOrderKey).withMessage('Compra inválida'),
  body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha inválida'),
  body('dueDate').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha límite inválida'),
  body('supplier').optional().trim().isLength({ max: 100 }).withMessage('El nombre del proveedor es demasiado largo'),
];

const payValidation = [
  body('paidAt').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha de pago inválida'),
  body('paymentMethod').optional({ checkFalsy: true }).isIn(PAYMENT_METHODS).withMessage('Método de pago inválido'),
];

router.get('/pending', getPendingExpenses);
router.post('/pending', pendingOrderValidation, validate, createPendingOrder);
router.post('/pending/order/:orderId/pay', payValidation, validate, payOrder);
router.post('/pending/order/:orderId/items', addItemsValidation, validate, addItemsToOrder);
router.put('/pending/order/:orderId', orderUpdateValidation, validate, updatePendingOrder);
router.delete('/pending/order/:orderId', param('orderId').custom(isOrderKey).withMessage('Compra inválida'), validate, deletePendingOrder);
router.put('/pending/line/:lineKey', lineUpdateValidation, validate, updatePendingLine);
router.delete('/pending/line/:lineKey', param('lineKey').custom(isOrderKey).withMessage('Producto inválido'), validate, deletePendingLine);
router.post('/pending/line/:lineKey/pay', [param('lineKey').custom(isOrderKey).withMessage('Producto inválido'), ...payValidation], validate, payLine);
router.patch('/:id/pay', payValidation, validate, payExpense);

router.get('/', getExpenses);
router.post('/', expenseValidation, validate, createExpense);
router.put('/:id', expenseValidation, validate, updateExpense);
router.delete('/:id', deleteExpense);

module.exports = router;