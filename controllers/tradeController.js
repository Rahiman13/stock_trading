const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

const buyStock = async (req, res) => {
  try {
    const { userId, stockId, quantity } = req.body;

    const user = await User.findById(userId);
    const stock = await Stock.findById(stockId);

    if (quantity > stock.quantity) {
      return res.status(400).json({ message: "Not enough stocks available" });
    }

    const cost = quantity * stock.price;
    if (user.balance < cost) {
      return res.status(400).json({ message: "Insufficient funds" });
    }

    user.balance -= cost;
    user.stocksOwned.push({ stockId, quantity });
    stock.quantity -= quantity;

    await user.save();
    await stock.save();
    await new Transaction({ userId, stockId, type: "BUY", quantity, price: stock.price }).save();

    res.json({ message: "Stock purchased successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sellStock = async (req, res) => {
  try {
    const { userId, stockId, quantity } = req.body;

    const user = await User.findById(userId);
    const stock = await Stock.findById(stockId);
    const userStock = user.stocksOwned.find((s) => s.stockId.toString() === stockId);

    if (!userStock || userStock.quantity < quantity) {
      return res.status(400).json({ message: "Not enough stocks to sell" });
    }

    userStock.quantity -= quantity;
    user.balance += quantity * stock.price;
    stock.quantity += quantity;

    await user.save();
    await stock.save();
    await new Transaction({ userId, stockId, type: "SELL", quantity, price: stock.price }).save();

    res.json({ message: "Stock sold successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  buyStock,
  sellStock
};
