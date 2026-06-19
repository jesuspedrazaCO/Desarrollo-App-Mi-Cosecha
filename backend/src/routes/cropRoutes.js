const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getCrops, getCropById, createCrop, updateCrop, deleteCrop } = require('../controllers/cropController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { cleanEmptyDates } = require('../middlewares/cleanEmptyFields');
const { validate } = require('../middlewares/validate');

router.use(protect);
router.use(normalizeDateFields(['startDate']));
router.use(cleanEmptyDates(['estimatedHarvestDate'])); // evita error si viene vacío

const cropValidation = [
  body('name').trim().notEmpty().withMessage('El nombre del cultivo es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre es demasiado largo'),
  body('type').trim().notEmpty().withMessage('El tipo de cultivo es obligatorio')
    .isLength({ max: 100 }).withMessage('El tipo es demasiado largo'),
  body('startDate').notEmpty().withMessage('La fecha de inicio es obligatoria')
    .isISO8601().withMessage('La fecha de inicio no es válida'),
  body('estimatedHarvestDate').optional({ checkFalsy: true })
    .isISO8601().withMessage('La fecha estimada no es válida'),
  body('landSize').optional().isFloat({ min: 0 }).withMessage('El tamaño debe ser un número positivo'),
  body('status').optional().isIn(['activo', 'finalizado', 'suspendido']).withMessage('Estado inválido'),
];

router.get('/', getCrops);
router.get('/:id', getCropById);
router.post('/', cropValidation, validate, createCrop);
router.put('/:id', cropValidation, validate, updateCrop);
router.delete('/:id', deleteCrop);

module.exports = router;
