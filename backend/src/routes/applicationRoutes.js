const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getApplications,
  getApplicationSummary,
  createApplication,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { validate } = require('../middlewares/validate');

router.use(protect);
router.use(normalizeDateFields(['date']));

const applicationValidation = [
  body('crop').notEmpty().withMessage('El cultivo es obligatorio').isMongoId().withMessage('Cultivo inválido'),
  body('date').notEmpty().withMessage('La fecha es obligatoria').isISO8601().withMessage('Fecha inválida'),
  body('type').optional().isIn(['fertilizacion', 'fumigacion', 'riego', 'otro']).withMessage('Tipo de labor inválido'),
  body('items').isArray({ min: 1 }).withMessage('Agrega al menos un producto'),
  body('items.*.product').trim().notEmpty().withMessage('El producto es obligatorio').isLength({ max: 100 }).withMessage('El nombre del producto es demasiado largo'),
  body('items.*.quantity').isFloat({ min: 0 }).withMessage('La cantidad debe ser un número positivo'),
  body('items.*.unit').optional().trim().isLength({ max: 20 }).withMessage('La unidad es demasiado larga'),
  body('tankVolume').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('El volumen del tanque debe ser un número positivo'),
  body('tankCount').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 1000 }).withMessage('El número de canecas debe ser un entero entre 1 y 1000'),
  body('items.*.perTank').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).withMessage('La cantidad por caneca debe ser un número positivo'),
  body('tankUnit').optional().trim().isLength({ max: 20 }).withMessage('La unidad del tanque es demasiado larga'),
  body('observations').optional().trim().isLength({ max: 500 }).withMessage('Las observaciones son demasiado largas'),
];

// IMPORTANTE: /summary debe ir antes de cualquier ruta con /:id para que
// Express no intente interpretar "summary" como un ID de Mongo.
router.get('/summary', getApplicationSummary);
router.get('/', getApplications);
router.post('/', applicationValidation, validate, createApplication);
router.put('/:id', applicationValidation, validate, updateApplication);
router.delete('/:id', deleteApplication);

module.exports = router;