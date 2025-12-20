const express = require("express");
const router = express.Router();

const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// ===============================
// GET ALL PENDING WITHDRAWALS
// ===============================
router.get("/pending", auth, admin, async (req, res) => {
  const withdrawals = await Withdrawal.find({ status: "pending" })
    .populate("user", "name email walletBalance");

  res.json(withdrawals);
});

// ===============================
// APPROVE WITHDRAWAL
// ===============================
router.post("/:id/approve", auth, admin, async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) {
    return res.status(404).json({ message: "Withdrawal not found" });
  }

  if (withdrawal.status !== "pending") {
    return res.status(400).json({ message: "Already processed" });
  }

  const user = await User.findById(withdrawal.user);

  if (user.walletBalance < withdrawal.amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  user.walletBalance -= withdrawal.amount;
  withdrawal.status = "approved";

  await user.save();
  await withdrawal.save();

  res.json({ message: "Withdrawal approved successfully" });
});

// ===============================
// REJECT WITHDRAWAL
// ===============================
router.post("/:id/reject", auth, admin, async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  if (!withdrawal) {
    return res.status(404).json({ message: "Withdrawal not found" });
  }

  withdrawal.status = "rejected";
  await withdrawal.save();

  res.json({ message: "Withdrawal rejected" });
});

module.exports = router;
