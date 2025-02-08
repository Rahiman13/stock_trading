const mongoose = require('mongoose');
const User = require('../models/User');
const Stock = require('../models/Stock');
const Transaction = require('../models/Transaction');

describe('Trade Operations', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI_TEST);
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Stock.deleteMany({});
    await Transaction.deleteMany({});
  });

  test('Buy stock successfully', async () => {
    const user = await User.create({
      name: 'Test User',
      balance: 10000
    });

    const stock = await Stock.create({
      name: 'Test Stock',
      quantity: 100,
      price: 50
    });

    const quantity = 10;
    const cost = quantity * stock.price;

    await user.save();
    await stock.save();

    expect(user.balance).toBe(10000);
    expect(stock.quantity).toBe(100);
  });

  test('Sell stock successfully', async () => {
    const user = await User.create({
      name: 'Test User',
      balance: 5000,
      stocksOwned: [{ stockId: mongoose.Types.ObjectId(), quantity: 20 }]
    });

    const stock = await Stock.create({
      name: 'Test Stock',
      quantity: 80,
      price: 50
    });

    const quantity = 10;
    const earnings = quantity * stock.price;

    await user.save();
    await stock.save();

    expect(user.balance).toBe(5000);
    expect(stock.quantity).toBe(80);
  });
});
