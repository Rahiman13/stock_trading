const Stock = require('../models/Stock');
const User = require('../models/User');

const generateRandomPrice = (currentPrice) => {
  // Maximum percentage change (2% up or down)
  const maxChange = 0.02;
  
  // Generate random percentage change between -2% and +2%
  const percentageChange = (Math.random() * 2 - 1) * maxChange;
  
  // Calculate new price
  let newPrice = currentPrice * (1 + percentageChange);
  
  // Ensure price stays within bounds (1-100)
  newPrice = Math.min(Math.max(newPrice, 1), 100);
  
  // Round to 2 decimal places
  return Math.round(newPrice * 100) / 100;
};

const calculatePerformance = (history) => {
  if (history.length < 2) return { dailyChange: 0, weeklyChange: 0, monthlyChange: 0 };
  
  const current = history[history.length - 1].price;
  const dayAgo = history.find(h => 
    h.timestamp >= new Date(Date.now() - 24*60*60*1000))?.price || current;
  const weekAgo = history.find(h => 
    h.timestamp >= new Date(Date.now() - 7*24*60*60*1000))?.price || current;
  const monthAgo = history.find(h => 
    h.timestamp >= new Date(Date.now() - 30*24*60*60*1000))?.price || current;

  return {
    dailyChange: ((current - dayAgo) / dayAgo) * 100,
    weeklyChange: ((current - weekAgo) / weekAgo) * 100,
    monthlyChange: ((current - monthAgo) / monthAgo) * 100
  };
};

const updateStockPrices = async () => {
  try {
    const stocks = await Stock.find();
    const updates = [];
    
    for (const stock of stocks) {
      const newPrice = generateRandomPrice(stock.price);
      stock.price = newPrice;
      stock.history.push({
        price: newPrice,
        timestamp: new Date()
      });
      
      // Keep only last 30 days of history
      if (stock.history.length > 43200) { // 30 days * 1440 1-minute intervals
        stock.history = stock.history.slice(-43200);
      }
      
      stock.performance = calculatePerformance(stock.history);
      updates.push(stock.save());
    }
    
    await Promise.all(updates);
    
    // Update user profit/loss calculations
    const users = await User.find({ isTrading: true });
    for (const user of users) {
      await updateUserProfitLoss(user);
    }
    
    console.log(`Stock prices updated at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error updating stock prices:', error);
  }
};

const updateUserProfitLoss = async (user) => {
  try {
    let totalValue = user.balance;
    let totalInvestment = user.totalLoanAmount;
    
    for (const stock of user.stocksOwned) {
      const stockData = await Stock.findById(stock.stockId);
      if (stockData) {
        totalValue += stockData.price * stock.quantity;
      }
    }
    
    user.profitLoss = totalValue - totalInvestment;
    
    // Check if user should stop trading
    if (totalValue <= 0 || user.balance <= 0) {
      user.isTrading = false;
    }
    
    await user.save();
  } catch (error) {
    console.error(`Error updating user ${user._id} profit/loss:`, error);
  }
};

// Start the price update interval (60 seconds)
const startPriceUpdates = () => {
  // Update prices every 60 seconds
  setInterval(async () => {
    try {
      const stocks = await Stock.find();
      const updates = [];
      
      for (const stock of stocks) {
        const newPrice = generateRandomPrice(stock.price);
        stock.price = newPrice;
        stock.history.push({
          price: newPrice,
          timestamp: new Date()
        });
        
        // Keep only last 30 days of history
        if (stock.history.length > 43200) { // 30 days * 1440 1-minute intervals
          stock.history = stock.history.slice(-43200);
        }
        
        stock.performance = calculatePerformance(stock.history);
        updates.push(stock.save());
      }
      
      await Promise.all(updates);
      
      // Update user profit/loss calculations
      const users = await User.find({ isTrading: true });
      for (const user of users) {
        await updateUserProfitLoss(user);
      }
      
      console.log(`Stock prices updated at ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Error updating stock prices:', error);
    }
  }, 60000); // 60 seconds interval
};

module.exports = { startPriceUpdates };
