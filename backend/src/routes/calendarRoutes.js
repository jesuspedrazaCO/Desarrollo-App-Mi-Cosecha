const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getEvents, getUpcomingEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/calendarController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { cleanEmptyFields } = require('../middlewares/cleanEmptyFields');
const { validate } = require('../middlewares/validate');
const { EVENT_TYPES } = require('../models/CalendarEvent');

router.use(protect);
router.use(normalizeDateFields(['date']));
router.use(cleanEmptyFields(['crop']));

const eventValidation = [
  body('title').trim().notEmpty().withMessage('El título es obligatorio')
    .isLength({ max: 150 }).withMessage('El título es demasiado largo'),
  body('type').optional().isIn(EVENT_TYPES).withMessage('Tipo de evento inválido'),
  body('date').notEmpty().withMessage('La fecha es obligatoria').isISO8601().withMessage('Fecha inválida'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('El valor debe ser un número positivo'),
  body('crop').optional({ checkFalsy: true }).isMongoId().withMessage('Cultivo inválido'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Las notas son demasiado largas'),
  body('completed').optional().isBoolean().withMessage('El valor debe ser verdadero o falso'),
];

router.get('/', getEvents);
router.get('/upcoming', getUpcomingEvents);
router.post('/', eventValidation, validate, createEvent);
router.put('/:id', eventValidation, validate, updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;
