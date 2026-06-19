const express = require('express');
const router = express.Router();
const {
  getCropsComparison,
  getAgroExpensesReport,
  getAgroIncomeReport,
  getHouseholdReport,
} = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/crops-comparison', getCropsComparison);
router.get('/agro-expenses', getAgroExpensesReport);
router.get('/agro-income', getAgroIncomeReport);
router.get('/household', getHouseholdReport);

module.exports = router;
