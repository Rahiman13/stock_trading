const User = require('../models/User');

const takeLoan = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (amount > user.availableLoanLimit) {
      return res.status(400).json({ 
        message: "Loan amount exceeds available limit" 
      });
    }

    user.balance += amount;
    user.totalLoanAmount += amount;
    user.availableLoanLimit -= amount;

    await user.save();

    res.json({
      message: "Loan approved successfully",
      balance: user.balance,
      totalLoanAmount: user.totalLoanAmount,
      availableLoanLimit: user.availableLoanLimit
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { takeLoan };
