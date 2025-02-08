const mongoose = require("mongoose");

const StockSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 1,
    max: 100
  },
  history: [{
    price: Number,
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  performance: {
    dailyChange: Number,
    weeklyChange: Number,
    monthlyChange: Number
  }
});

module.exports = mongoose.model("Stock", StockSchema);

