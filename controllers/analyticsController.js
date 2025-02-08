const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

const getUserReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    const transactions = await Transaction.find({ userId })
      .populate('stockId')
      .sort({ timestamp: -1 });
    
    const portfolioValue = await user.calculatePortfolioValue();
    const profitLoss = portfolioValue - user.totalLoanAmount;
    
    const stockWiseAnalysis = await Promise.all(
      user.stocksOwned.map(async (stock) => {
        const stockData = await Stock.findById(stock.stockId);
        const currentValue = stockData.price * stock.quantity;
        const stockProfitLoss = currentValue - stock.totalInvestment;
        
        return {
          stockName: stockData.name,
          quantity: stock.quantity,
          purchasePrice: stock.purchasePrice,
          currentPrice: stockData.price,
          totalInvestment: stock.totalInvestment,
          currentValue,
          profitLoss: stockProfitLoss,
          profitPercentage: (stockProfitLoss / stock.totalInvestment) * 100
        };
      })
    );

    res.json({
      userId: user._id,
      name: user.name,
      balance: user.balance,
      totalLoanAmount: user.totalLoanAmount,
      portfolioValue,
      profitLoss,
      profitPercentage: (profitLoss / user.totalLoanAmount) * 100,
      isTrading: user.isTrading,
      stockWiseAnalysis,
      recentTransactions: transactions.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockReport = async (req, res) => {
  try {
    const stocks = await Stock.find();
    const reports = await Promise.all(
      stocks.map(async (stock) => {
        const transactions = await Transaction.find({ stockId: stock._id });
        const buyVolume = transactions
          .filter(t => t.type === 'BUY')
          .reduce((sum, t) => sum + t.quantity, 0);
        const sellVolume = transactions
          .filter(t => t.type === 'SELL')
          .reduce((sum, t) => sum + t.quantity, 0);
        
        return {
          stockId: stock._id,
          name: stock.name,
          currentPrice: stock.price,
          performance: stock.performance,
          tradingVolume: {
            buy: buyVolume,
            sell: sellVolume,
            total: buyVolume + sellVolume
          },
          priceHistory: stock.history.slice(-288) // Last 24 hours
        };
      })
    );
    
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTopUsers = async (req, res) => {
  try {
    const users = await User.find();
    const userPerformance = await Promise.all(
      users.map(async (user) => {
        const portfolioValue = await user.calculatePortfolioValue();
        const profitLoss = portfolioValue - user.totalLoanAmount;
        
        return {
          userId: user._id,
          name: user.name,
          profitLoss,
          profitPercentage: (profitLoss / user.totalLoanAmount) * 100,
          portfolioValue,
          isTrading: user.isTrading
        };
      })
    );

    const topUsers = userPerformance
      .sort((a, b) => b.profitLoss - a.profitLoss)
      .slice(0, 10);

    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTopStocks = async (req, res) => {
  try {
    const stocks = await Stock.find();
    const stockPerformance = stocks.map(stock => ({
      stockId: stock._id,
      name: stock.name,
      price: stock.price,
      performance: stock.performance,
      availableQuantity: stock.quantity
    }));

    const topStocks = stockPerformance
      .sort((a, b) => b.performance.dailyChange - a.performance.dailyChange)
      .slice(0, 10);

    res.json(topStocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getUserReport,
  getStockReport,
  getTopUsers,
  getTopStocks
};
