// controllers/walletController.js
const User = require("../models/user");

const MIN_WITHDRAWAL = 12;

// ===============================
// GET BALANCE
// ===============================
exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("walletBalance");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      balance: user.walletBalance
    });

  } catch (err) {
    console.error("Get balance error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ===============================
// ADD MONEY TO WALLET
// ===============================
exports.addMoney = async (req, res) => {
  try {
    let { amount } = req.body;
    amount = Number(amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    user.walletBalance += amount;
    await user.save();

    res.json({
      success: true,
      balance: user.walletBalance
    });

  } catch (err) {
    console.error("Add money error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// ===============================
// WITHDRAW MONEY (LOGIC REFINED)
// ===============================
exports.withdrawMoney = async (req, res) => {
  try {
    let { amount } = req.body;
    amount = Number(amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // ❌ No money at all
    if (user.walletBalance <= 0) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    // ❌ Has money but less than minimum
    if (user.walletBalance < MIN_WITHDRAWAL) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal is $${MIN_WITHDRAWAL}`
      });
    }

    // ❌ Trying to withdraw more than available
    if (amount > user.walletBalance) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance"
      });
    }

    user.walletBalance -= amount;
    await user.save();

    res.json({
      success: true,
      balance: user.walletBalance
    });

  } catch (err) {
    console.error("Withdraw error:", err);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
