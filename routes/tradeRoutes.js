const express = require("express");
const User = require("../models/User");
const Stock = require("../models/Stock");
const Transaction = require("../models/Transaction");
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// Protect all trade routes
router.use(auth);

// Buy stocks
router.post("/buy", async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user has zero balance
    if (user.balance <= 0) {
      console.log(`WARNING: User ${user.name} (${userId}) attempted to trade with zero balance`);
      return res.status(400).json({ 
        message: "Trading stopped: Insufficient balance",
        balance: user.balance,
        requiredBalance: quantity * stock.price
      });
    }

    // Check trading eligibility
    const canTrade = await user.checkTradingEligibility();
    if (!canTrade) {
      console.log(`WARNING: User ${user.name} (${userId}) is not eligible for trading`);
      return res.status(400).json({ 
        message: "Trading stopped: Trading limit reached or insufficient funds",
        balance: user.balance,
        totalLoanAmount: user.totalLoanAmount
      });
    }

    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const cost = quantity * stock.price;
    
    // Enhanced balance check with detailed message
    if (user.balance < cost) {
      console.log(`WARNING: User ${user.name} (${userId}) attempted to buy ${quantity} shares of ${stock.name} for $${cost} with balance $${user.balance}`);
      return res.status(400).json({ 
        message: "Insufficient funds for purchase",
        balance: user.balance,
        requiredAmount: cost,
        shortfall: cost - user.balance
      });
    }

    // Check stock availability
    if (quantity > stock.quantity) {
      console.log(`WARNING: Stock ${stock.name} is out of stock. Required: ${quantity}, Available: ${stock.quantity}`);
      return res.status(400).json({ 
        message: "Not enough stocks available",
        requested: quantity,
        available: stock.quantity
      });
    }

    // Execute trade
    user.balance -= cost;
    user.stocksOwned.push({ 
      stockId, 
      quantity, 
      purchasePrice: stock.price,
      totalInvestment: cost
    });
    stock.quantity -= quantity;

    await user.save();
    await stock.save();
    await new Transaction({ 
      userId, 
      stockId, 
      type: "BUY", 
      quantity, 
      price: stock.price,
      totalAmount: cost
    }).save();

    console.log(`SUCCESS: User ${user.name} bought ${quantity} shares of ${stock.name} for $${cost}`);
    
    res.json({ 
      message: "Stock purchased successfully",
      balance: user.balance,
      stocksOwned: user.stocksOwned,
      transaction: {
        type: "BUY",
        quantity,
        price: stock.price,
        totalAmount: cost
      }
    });
  } catch (error) {
    console.error('Trade Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Sell stocks
router.post("/sell", async (req, res) => {
  try {
    const { stockId, quantity } = req.body;
    const userId = req.user.userId; // Get userId from auth middleware

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }

    const userStock = user.stocksOwned.find((s) => s.stockId.toString() === stockId);
    if (!userStock || userStock.quantity < quantity) {
      return res.status(400).json({ message: "Not enough stocks to sell" });
    }

    userStock.quantity -= quantity;
    user.balance += quantity * stock.price;
    stock.quantity += quantity;

    // Remove stock from user's portfolio if quantity becomes 0
    if (userStock.quantity === 0) {
      user.stocksOwned = user.stocksOwned.filter((s) => s.stockId.toString() !== stockId);
    }

    await user.save();
    await stock.save();
    await new Transaction({ userId, stockId, type: "SELL", quantity, price: stock.price }).save();

    res.json({ 
      message: "Stock sold successfully",
      balance: user.balance,
      stocksOwned: user.stocksOwned
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
