// routes/withdrawalRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");

// ===============================
// REQUEST WITHDRAWAL (PENDING)
// ===============================
router.post("/withdraw", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isManuallyVerified) {
      return res.status(403).json({ message: "Account not verified" });
    }

    let { amount, paymentMethod, paymentAddress } = req.body;
    amount = Number(amount);

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (amount < 12) {
      return res.status(400).json({ message: "Minimum withdrawal is $12" });
    }

    if (amount > user.walletBalance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      method: paymentMethod,
      address: paymentAddress,
      status: "pending"
    });

    res.json({
      success: true,
      message: "Withdrawal request submitted",
      withdrawal
    });

  } catch (err) {
    console.error("Withdrawal request error:", err);
    res.status(500).json({ message: "Withdrawal failed" });
  }
});

// ===============================
// USER WITHDRAWAL HISTORY
// ===============================
router.get("/history", auth, async (req, res) => {
  try {
    const history = await Withdrawal.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      history
    });
  } catch (err) {
    console.error("History error:", err);
    res.status(500).json({ message: "Failed to load history" });
  }
});

module.exports = router;
