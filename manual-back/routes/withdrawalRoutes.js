// routes/withdrawalRoutes.js

const express = require("express");
const router = express.Router();

const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// ===============================
// USER REQUEST WITHDRAWAL
// ===============================
router.post("/request", auth, async (req, res) => {
  try {
    const user = req.user;
    const { amount, paymentMethod, paymentAddress } = req.body;

    if (!user.isManuallyVerified) {
      return res.status(403).json({
        message: "Account not verified for withdrawals"
      });
    }

    if (!amount || amount < 12) {
      return res.status(400).json({
        message: "Minimum withdrawal amount is $12"
      });
    }

    if (amount > user.walletBalance) {
      return res.status(400).json({
        message: "Insufficient balance"
      });
    }

    // Create withdrawal record
    const withdrawal = await Withdrawal.create({
      user: user._id,
      amount,
      method: paymentMethod,
      address: paymentAddress,
      status: "pending"
    });

    // Mirror withdrawal in user document
    user.withdrawalHistory.push({
      amount,
      status: "pending",
      note: "Withdrawal request submitted"
    });

    await user.save();

    return res.status(201).json({
      success: true,
      message: "Withdrawal request submitted and pending approval",
      withdrawal
    });

  } catch (error) {
    console.error("❌ Withdrawal request error:", error);
    return res.status(500).json({
      message: "Withdrawal request failed"
    });
  }
});

// ===============================
// ADMIN: GET ALL PENDING WITHDRAWALS
// ===============================
router.get("/pending", auth, admin, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({ status: "pending" })
      .populate("user", "name email walletBalance")
      .sort({ createdAt: -1 });

    return res.json(withdrawals);
  } catch (error) {
    console.error("❌ Fetch pending withdrawals error:", error);
    return res.status(500).json({
      message: "Failed to fetch withdrawals"
    });
  }
});

// ===============================
// ADMIN: APPROVE WITHDRAWAL
// ===============================
router.post("/:id/approve", auth, admin, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({ message: "Withdrawal already processed" });
    }

    const user = await User.findById(withdrawal.user);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.walletBalance < withdrawal.amount) {
      return res.status(400).json({
        message: "User balance insufficient"
      });
    }

    // Deduct balance ONLY on approval
    user.walletBalance -= withdrawal.amount;

    // Mirror approved history
    user.withdrawalHistory.push({
      amount: withdrawal.amount,
      status: "approved",
      note: "Withdrawal approved by admin"
    });

    withdrawal.status = "approved";

    await user.save();
    await withdrawal.save();

    return res.json({
      success: true,
      message: "Withdrawal approved and balance updated"
    });

  } catch (error) {
    console.error("❌ Approve withdrawal error:", error);
    return res.status(500).json({
      message: "Approval failed"
    });
  }
});

// ===============================
// ADMIN: REJECT WITHDRAWAL
// ===============================
router.post("/:id/reject", auth, admin, async (req, res) => {
  try {
    const withdrawal = await Withdrawal.findById(req.params.id);
    if (!withdrawal) {
      return res.status(404).json({ message: "Withdrawal not found" });
    }

    if (withdrawal.status !== "pending") {
      return res.status(400).json({
        message: "Withdrawal already processed"
      });
    }

    withdrawal.status = "rejected";
    await withdrawal.save();

    const user = await User.findById(withdrawal.user);
    if (user) {
      user.withdrawalHistory.push({
        amount: withdrawal.amount,
        status: "rejected",
        note: "Withdrawal rejected by admin"
      });
      await user.save();
    }

    return res.json({
      success: true,
      message: "Withdrawal rejected"
    });

  } catch (error) {
    console.error("❌ Reject withdrawal error:", error);
    return res.status(500).json({
      message: "Rejection failed"
    });
  }
});

// ===============================
// USER: GET MY WITHDRAWAL HISTORY
// ===============================
router.get("/history", auth, async (req, res) => {
  try {
    const withdrawals = await Withdrawal.find({
      user: req.user._id
    }).sort({ createdAt: -1 });

    return res.json(withdrawals);
  } catch (error) {
    console.error("❌ Withdrawal history error:", error);
    return res.status(500).json({
      message: "Failed to load withdrawal history"
    });
  }
});

module.exports = router;
