const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { getReceipts, uploadReceipt, deleteReceipt } = require('../controllers/receiptController');
const { protect } = require('../middlewares/authMiddleware');
const { normalizeDateFields } = require('../middlewares/normalizeDates');
const { validate } = require('../middlewares/validate');
const upload = require('../middlewares/uploadMiddleware');

router.use(protect);

router.get('/', getReceipts);

router.post(
  '/',
  upload.single('file'),
  normalizeDateFields(['date']),
  [
    body('crop').optional({ checkFalsy: true }).isMongoId().withMessage('Cultivo inválido'),
    body('category').optional().trim().isLength({ max: 100 }).withMessage('La categoría es demasiado larga'),
    body('description').optional().trim().isLength({ max: 200 }).withMessage('La descripción es demasiado larga'),
    body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Fecha inválida'),
  ],
  validate,
  uploadReceipt
);

router.delete('/:id', deleteReceipt);

module.exports = router;