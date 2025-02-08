const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

const generateRandomTrades = async (req, res) => {
  try {
    const trades = [];
    const users = await User.find();
    const stocks = await Stock.find();

    for (let i = 0; i < 100; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)];
      const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
      const tradeType = Math.random() > 0.5 ? 'BUY' : 'SELL';
      const quantity = Math.floor(Math.random() * 10) + 1;

      // Check if user owns enough of the stock before attempting to sell
      if (tradeType === 'SELL') {
        const userStock = randomUser.stocksOwned.find(
          stock => stock.stockId.toString() === randomStock._id.toString()
        );
        
        if (!userStock || userStock.quantity < quantity) {
          // Skip this trade and try to generate a buy trade instead
          const buyTradeResult = await executeBuyTrade(randomUser, randomStock, quantity);
          if (!buyTradeResult.success) {
            continue; // Skip if buy also fails
          }
          
          trades.push({
            userId: randomUser._id,
            userName: randomUser.name,
            stockId: randomStock._id,
            stockName: randomStock.name,
            tradeType: 'BUY',
            quantity,
            price: randomStock.price,
            status: 'SUCCESS',
            message: "Converted to buy trade",
            profitLoss: randomUser.profitLoss,
            timestamp: new Date()
          });
          continue;
        }
      }

      let tradeResult;
      if (tradeType === 'BUY') {
        tradeResult = await executeBuyTrade(randomUser, randomStock, quantity);
      } else {
        tradeResult = await executeSellTrade(randomUser, randomStock, quantity);
      }

      if (tradeResult.success) {
        trades.push({
          userId: randomUser._id,
          userName: randomUser.name,
          stockId: randomStock._id,
          stockName: randomStock.name,
          tradeType,
          quantity,
          price: randomStock.price,
          status: 'SUCCESS',
          message: tradeResult.message,
          profitLoss: randomUser.profitLoss,
          timestamp: new Date()
        });
      }
    }

    res.json({
      totalTrades: trades.length,
      successfulTrades: trades.filter(t => t.status === 'SUCCESS').length,
      failedTrades: trades.filter(t => t.status === 'FAILED').length,
      trades: trades
    });
  } catch (error) {
    console.error('Simulation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const executeBuyTrade = async (user, stock, quantity) => {
  try {
    if (!await user.checkTradingEligibility()) {
      return { success: false, message: "User not eligible for trading" };
    }

    if (quantity > stock.quantity) {
      console.log(`Stock ${stock.name} is out of stock for quantity ${quantity}`);
      return { success: false, message: "Insufficient stock quantity" };
    }

    const cost = quantity * stock.price;
    if (user.balance < cost) {
      return { success: false, message: "Insufficient funds" };
    }

    user.balance -= cost;
    user.stocksOwned.push({
      stockId: stock._id,
      quantity,
      purchasePrice: stock.price,
      totalInvestment: cost
    });
    stock.quantity -= quantity;

    await user.save();
    await stock.save();
    await new Transaction({
      userId: user._id,
      stockId: stock._id,
      type: "BUY",
      quantity,
      price: stock.price,
      totalAmount: cost
    }).save();

    return { success: true, message: "Trade successful" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

const executeSellTrade = async (user, stock, quantity) => {
  try {
    const userStock = user.stocksOwned.find(
      (s) => s.stockId.toString() === stock._id.toString()
    );

    if (!userStock || userStock.quantity < quantity) {
      return { success: false, message: "Not enough stocks to sell" };
    }

    userStock.quantity -= quantity;
    user.balance += quantity * stock.price;
    stock.quantity += quantity;

    if (userStock.quantity === 0) {
      user.stocksOwned = user.stocksOwned.filter(
        (s) => s.stockId.toString() !== stock._id.toString()
      );
    }

    await user.save();
    await stock.save();
    await new Transaction({
      userId: user._id,
      stockId: stock._id,
      type: "SELL",
      quantity,
      price: stock.price
    }).save();

    return { success: true, message: "Trade successful" };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

router.post('/random-trades', generateRandomTrades);

module.exports = router;
