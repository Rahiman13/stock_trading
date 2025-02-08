const express = require("express");
const User = require("../models/User");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { auth } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes (no authentication needed)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    user = new User({
      name,
      email,
      password: hashedPassword
    });
    
    await user.save();
    
    // Generate token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    
    res.json({ 
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET
    );
    
    res.json({ 
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected routes (authentication needed)
router.use(auth);

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a user
router.post("/create", async (req, res) => {
  const { name } = req.body;
  const user = new User({ name });
  await user.save();
  res.json(user);
});

// Take a loan
router.post("/loan", async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if new loan amount exceeds available limit
    if (user.totalLoanAmount + amount > user.availableLoanLimit) {
      return res.status(400).json({ 
        message: "Loan limit exceeded",
        currentLoan: user.totalLoanAmount,
        availableLimit: user.availableLoanLimit,
        requestedAmount: amount
      });
    }

    user.totalLoanAmount += amount;
    user.balance += amount;
    await user.save();

    res.json({ 
      message: "Loan approved", 
      balance: user.balance,
      totalLoanAmount: user.totalLoanAmount,
      availableLoanLimit: user.availableLoanLimit,
      remainingLimit: user.availableLoanLimit - user.totalLoanAmount
    });
  } catch (error) {
    console.error('Loan Error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
