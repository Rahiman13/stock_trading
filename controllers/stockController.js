const Stock = require('../models/Stock');

const registerStock = async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    
    const stock = new Stock({
      name,
      quantity,
      price,
      history: [{ timestamp: new Date(), price }]
    });
    
    await stock.save();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStock = async (req, res) => {
  try {
    const { name, quantity, price } = req.body;
    const stock = await Stock.findById(req.params.id);

    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    stock.name = name || stock.name;
    stock.quantity = quantity || stock.quantity;
    stock.price = price || stock.price;
    
    await stock.save();
    res.json(stock);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStockHistory = async (req, res) => {
  try {
    const stocks = await Stock.find({}, { name: 1, history: 1 });
    res.json(stocks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerStock,
  updateStock,
  getStockHistory
};
