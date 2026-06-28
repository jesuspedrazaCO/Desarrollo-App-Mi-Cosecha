const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getLists, getListById, createList, updateList, deleteList,
  addItem, updateItem, deleteItem,
} = require('../controllers/marketController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { validate } = require('../middlewares/validate');

router.use(protect);
router.use(normalizeDateFields(['date']));

const listValidation = [
  body('name').trim().notEmpty().withMessage('El nombre de la lista es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo'),
  body('status').optional().isIn(['pendiente', 'completada']).withMessage('Estado inválido'),
  body('observations').optional().trim().isLength({ max: 500 }),
];

// Validación para CREAR item (name obligatorio)
const createItemValidation = [
  body('name').trim().notEmpty().withMessage('El nombre del producto es obligatorio')
    .isLength({ max: 100 }),
  body('quantity').optional().isFloat({ min: 0 }),
  body('unit').optional().trim().isLength({ max: 20 }),
  body('estimatedPrice').optional().isFloat({ min: 0 }),
  body('purchased').optional().isBoolean(),
];

// Validación para ACTUALIZAR item (todos opcionales — permite toggle de purchased solo)
const updateItemValidation = [
  body('name').optional().trim().isLength({ max: 100 }),
  body('quantity').optional().isFloat({ min: 0 }),
  body('unit').optional().trim().isLength({ max: 20 }),
  body('estimatedPrice').optional().isFloat({ min: 0 }),
  body('purchased').optional().isBoolean(),
];

// Listas
router.get('/lists', getLists);
router.get('/lists/:id', getListById);
router.post('/lists', listValidation, validate, createList);
router.put('/lists/:id', listValidation, validate, updateList);
router.delete('/lists/:id', deleteList);

// Productos
router.post('/lists/:listId/items', createItemValidation, validate, addItem);
router.put('/items/:id', updateItemValidation, validate, updateItem); // name opcional aquí
router.delete('/items/:id', deleteItem);

module.exports = router;
