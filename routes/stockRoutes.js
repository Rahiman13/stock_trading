const express = require("express");
const Stock = require("../models/Stock");
const { auth } = require('../middleware/authMiddleware');
const { registerStock, updateStock, getStockHistory } = require('../controllers/stockController');

const router = express.Router();

// Public routes
router.get("/list", async (req, res) => {
  const stocks = await Stock.find();
  res.json(stocks);
});

// Protected routes
router.use(auth);

// Vendor-only routes
router.post("/register", registerStock);
router.get("/history", getStockHistory);
router.put("/:id", updateStock);

// Update stock quantity
router.put("/update-quantity", async (req, res) => {
  try {
    const { stockId, newQuantity } = req.body;

    if (!stockId || newQuantity === undefined) {
      return res.status(400).json({ 
        message: "Stock ID and new quantity are required" 
      });
    }

    const stock = await Stock.findById(stockId);
    if (!stock) {
      return res.status(404).json({ 
        message: "Stock not found",
        stockId 
      });
    }

    // Log the quantity change
    console.log(`Updating stock ${stock.name} quantity from ${stock.quantity} to ${newQuantity}`);

    stock.quantity = newQuantity;
    await stock.save();

    res.json({
      message: "Stock quantity updated successfully",
      stock: {
        id: stock._id,
        name: stock.name,
        quantity: newQuantity,
        price: stock.price
      }
    });
  } catch (error) {
    console.error('Stock Update Error:', error);
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  await Stock.findByIdAndDelete(req.params.id);
  res.json({ message: "Stock deleted successfully" });
});

module.exports = router;
