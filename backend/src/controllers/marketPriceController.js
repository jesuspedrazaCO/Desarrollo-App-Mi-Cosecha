const MarketPrice = require('../models/MarketPrice');

const getMarketPrices = async (req, res, next) => {
  try {
    const { search, category, limit = 100 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.product = { $regex: search, $options: 'i' };
    const prices = await MarketPrice.find(query).sort({ product: 1 }).limit(Number(limit));
    const lastUpdated = await MarketPrice.findOne().sort({ lastUpdated: -1 }).select('lastUpdated');
    res.json({ prices, total: prices.length, lastUpdated: lastUpdated?.lastUpdated || null });
  } catch (error) { next(error); }
};

const getMarketPriceSummary = async (req, res, next) => {
  try {
    const trending = await MarketPrice.find({ trend: { $in: ['subio', 'bajo'] } })
      .sort({ variationPct: -1 }).limit(6);
    const total = await MarketPrice.countDocuments();
    const lastUpdated = await MarketPrice.findOne().sort({ lastUpdated: -1 }).select('lastUpdated');
    res.json({ trending, total, lastUpdated: lastUpdated?.lastUpdated || null });
  } catch (error) { next(error); }
};

const getCategories = async (req, res, next) => {
  try {
    const categories = await MarketPrice.distinct('category');
    res.json(categories);
  } catch (error) { next(error); }
};

module.exports = { getMarketPrices, getMarketPriceSummary, getCategories };
