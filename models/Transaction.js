const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  stockId: mongoose.Schema.Types.ObjectId,
  type: { type: String, enum: ["BUY", "SELL"] },
  quantity: Number,
  price: Number,
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Transaction", TransactionSchema);
