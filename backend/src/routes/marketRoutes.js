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
  body('observations').optional().trim().isLength({ max: 500 }).withMessage('Las observaciones son demasiado largas'),
];

const itemValidation = [
  body('name').trim().notEmpty().withMessage('El nombre del producto es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo'),
  body('quantity').optional().isFloat({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('unit').optional().trim().isLength({ max: 20 }).withMessage('La unidad es demasiado larga'),
  body('estimatedPrice').optional().isFloat({ min: 0 }).withMessage('El precio estimado debe ser un número positivo'),
  body('purchased').optional().isBoolean().withMessage('El valor de "comprado" debe ser verdadero o falso'),
];

// Listas
router.get('/lists', getLists);
router.get('/lists/:id', getListById);
router.post('/lists', listValidation, validate, createList);
router.put('/lists/:id', listValidation, validate, updateList);
router.delete('/lists/:id', deleteList);

// Productos dentro de una lista
router.post('/lists/:listId/items', itemValidation, validate, addItem);
router.put('/items/:id', itemValidation, validate, updateItem);
router.delete('/items/:id', deleteItem);

module.exports = router;
