const Stock = require('../models/Stock');

const updateStockPrice = async (stockId, newPrice) => {
  try {
    const stock = await Stock.findById(stockId);
    if (!stock) throw new Error('Stock not found');

    stock.price = newPrice;
    stock.history.push({
      timestamp: new Date(),
      price: newPrice
    });

    await stock.save();
    return stock;
  } catch (error) {
    throw new Error(`Failed to update stock price: ${error.message}`);
  }
};

module.exports = {
  updateStockPrice
};
