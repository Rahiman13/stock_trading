const express = require('express');
const { auth } = require('../middleware/authMiddleware');
const {
  getUserReport,
  getStockReport,
  getTopUsers,
  getTopStocks
} = require('../controllers/analyticsController');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Protect all analytics routes
router.use(auth);

// Analytics & Reporting routes
router.get('/users/report', getUserReport);
router.get('/stocks/report', getStockReport);
router.get('/users/top', getTopUsers);
router.get('/stocks/top', getTopStocks);

// Get highest performing stocks
router.get('/top-performers', async (req, res) => {
  try {
    const stocks = await Stock.find().lean(); // Use lean() to get plain JavaScript objects
    
    // Calculate performance metrics for each stock
    const stockPerformance = await Promise.all(stocks.map(async stock => {
      const historyLength = stock.history?.length || 0;
      if (historyLength < 2) return null;

      const currentPrice = stock.price;
      const oldestPrice = stock.history[0].price;
      const priceChange = currentPrice - oldestPrice;
      const percentageChange = (priceChange / oldestPrice) * 100;

      // Get trading volume
      const volume = await Transaction.countDocuments({
        stockId: stock._id,
        timestamp: { 
          $gte: new Date(Date.now() - 24*60*60*1000) 
        }
      });

      // Return a plain object with only the data we need
      return {
        id: stock._id.toString(), // Convert ObjectId to string
        name: stock.name,
        currentPrice,
        priceChange: Number(priceChange.toFixed(2)),
        percentageChange: Number(percentageChange.toFixed(2)),
        volume,
        performance: stock.performance || 0
      };
    }));

    // Filter out null values and sort
    const validPerformers = stockPerformance
      .filter(stock => stock !== null)
      .sort((a, b) => b.percentageChange - a.percentageChange);

    const response = {
      timestamp: new Date().toISOString(),
      topPerformers: validPerformers.slice(0, 10),
      metrics: {
        totalStocks: stocks.length,
        averagePerformance: Number(
          (validPerformers.reduce((acc, curr) => acc + curr.percentageChange, 0) / 
          validPerformers.length).toFixed(2)
        )
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching top performers:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
