// routes/withdrawalRoutes.js — FINAL, SECURE & SYNCED WITH FRONTEND

const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");

// ================================
// REQUEST WITHDRAWAL (PENDING)
// ================================
router.post("/withdraw", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.isManuallyVerified) {
      return res.status(403).json({ message: "Account not verified. Please complete verification first." });
    }

    let { amount, paymentMethod, paymentAddress } = req.body;
    amount = Number(amount);

    // Basic validation (extra layer beyond frontend)
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (amount < 38) {
      return res.status(400).json({ message: "Minimum withdrawal is $38" });
    }

    if (amount > user.walletBalance) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    if (!paymentMethod || !["PayPal", "Venmo", "Cash App", "Phone Number"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid or missing payment method" });
    }

    if (!paymentAddress || typeof paymentAddress !== "string" || paymentAddress.trim() === "") {
      return res.status(400).json({ message: "Payment address/details required" });
    }

    // Create the withdrawal request
    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      method: paymentMethod,
      address: paymentAddress.trim(),
      status: "pending",
      requestedAt: new Date(),
    });

    // Optional: deduct balance immediately (uncomment if desired)
    // user.walletBalance -= amount;
    // await user.save();

    res.status(201).json({
      success: true,
      message: "Withdrawal request submitted successfully. It will be reviewed within 1–3 business days.",
      withdrawal,
    });
  } catch (err) {
    console.error("Withdrawal request error:", err.message);
    res.status(500).json({ message: "Server error — withdrawal request failed. Please try again later." });
  }
});

// ================================
// USER WITHDRAWAL HISTORY
// ================================
router.get("/history", auth, async (req, res) => {
  try {
    const history = await Withdrawal.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50) // prevent huge responses
      .select("amount method address status createdAt requestedAt");

    res.json({
      success: true,
      history,
    });
  } catch (err) {
    console.error("Withdrawal history error:", err.message);
    res.status(500).json({ message: "Failed to load withdrawal history" });
  }
});

module.exports = router;