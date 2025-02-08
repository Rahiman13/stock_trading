const User = require('../models/User');

const createUser = async (req, res) => {
  try {
    const { name } = req.body;
    const user = new User({ name });
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const takeLoan = async (req, res) => {
  try {
    const { userId, amount } = req.body;
    if (amount > 100000) return res.status(400).json({ message: "Loan limit exceeded" });

    const user = await User.findById(userId);
    user.loan += amount;
    user.balance += amount;
    await user.save();

    res.json({ message: "Loan approved", balance: user.balance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createUser,
  takeLoan
};
