const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  balance: { 
    type: Number, 
    default: 0 
  },
  totalLoanAmount: {
    type: Number,
    default: 0
  },
  availableLoanLimit: {
    type: Number,
    default: 100000
  },
  stocksOwned: [{ 
    stockId: mongoose.Schema.Types.ObjectId, 
    quantity: Number,
    purchasePrice: Number,
    totalInvestment: Number
  }],
  profitLoss: { 
    type: Number, 
    default: 0 
  },
  isTrading: {
    type: Boolean,
    default: true
  }
});

// Method to calculate total portfolio value
UserSchema.methods.calculatePortfolioValue = async function() {
  let portfolioValue = this.balance;
  for (const stock of this.stocksOwned) {
    const stockData = await mongoose.model('Stock').findById(stock.stockId);
    if (stockData) {
      portfolioValue += stockData.price * stock.quantity;
    }
  }
  return portfolioValue;
};

// Method to check trading eligibility
UserSchema.methods.checkTradingEligibility = async function() {
  const portfolioValue = await this.calculatePortfolioValue();
  const totalValue = portfolioValue;
  
  if (totalValue < 0 || this.balance <= 0) {
    this.isTrading = false;
    await this.save();
    return false;
  }
  return true;
};

module.exports = mongoose.model("User", UserSchema);
