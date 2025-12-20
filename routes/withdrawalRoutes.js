// routes/withdrawalRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");

// ===============================
// REQUEST WITHDRAWAL
// ===============================
router.post("/withdraw", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.isManuallyVerified) {
      return res.status(403).json({ message: "Account not verified" });
    }

    const { amount, paymentMethod, paymentAddress } = req.body;

    if (!amount || amount < 12) {
      return res.status(400).json({ message: "Minimum withdrawal is $12" });
    }

    if (amount > user.walletBalance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      method: paymentMethod,
      address: paymentAddress
    });

    res.json({ success: true, withdrawal });

  } catch (err) {
    console.error(err);
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

    res.json(history);
  } catch (err) {
    res.status(500).json({ message: "Failed to load history" });
  }
});

module.exports = router;
