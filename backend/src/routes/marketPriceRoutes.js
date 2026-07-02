const express = require('express');
const router = express.Router();
const { getMarketPrices, getMarketPriceSummary, getCategories } = require('../controllers/marketPriceController');
const { protect } = require('../middlewares/authMiddleware');

router.use(protect);

router.get('/', getMarketPrices);
router.get('/summary', getMarketPriceSummary);
router.get('/categories', getCategories);

module.exports = router;
