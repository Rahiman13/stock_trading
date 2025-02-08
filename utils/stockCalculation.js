const Stock = require('../models/Stock');

const generateRandomPrice = () => {
  return Math.floor(Math.random() * 100) + 1;
};

const calculatePerformance = (history) => {
  if (history.length < 2) return { dailyChange: 0, weeklyChange: 0, monthlyChange: 0 };
  
  const current = history[history.length - 1].price;
  const dayAgo = history.find(h => h.timestamp >= new Date(Date.now() - 24*60*60*1000))?.price || current;
  const weekAgo = history.find(h => h.timestamp >= new Date(Date.now() - 7*24*60*60*1000))?.price || current;
  const monthAgo = history.find(h => h.timestamp >= new Date(Date.now() - 30*24*60*60*1000))?.price || current;

  return {
    dailyChange: ((current - dayAgo) / dayAgo) * 100,
    weeklyChange: ((current - weekAgo) / weekAgo) * 100,
    monthlyChange: ((current - monthAgo) / monthAgo) * 100
  };
};

const updateStockPrices = async () => {
  try {
    const stocks = await Stock.find();
    
    for (const stock of stocks) {
      const newPrice = generateRandomPrice();
      stock.price = newPrice;
      stock.history.push({
        price: newPrice,
        timestamp: new Date()
      });
      
      stock.performance = calculatePerformance(stock.history);
      await stock.save();
    }
    
    console.log('Stock prices updated successfully');
  } catch (error) {
    console.error('Error updating stock prices:', error);
  }
};

// Schedule updates every 5 minutes
setInterval(updateStockPrices, 5 * 60 * 1000);

module.exports = {
  updateStockPrices,
  calculatePerformance
};
