// routes/adminWithdrawalsRoutes.js
const express = require("express");
const router = express.Router();
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/user");
const auth = require("../middleware/auth");

const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  next();
};

router.get("/withdrawals", auth, isAdmin, async (req, res) => {
  const withdrawals = await Withdrawal.find({ status: "pending" })
    .populate("user", "name email walletBalance");

  res.json(withdrawals);
});

router.post("/withdrawals/:id/approve", auth, isAdmin, async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  const user = await User.findById(withdrawal.user);

  if (withdrawal.status !== "pending") {
    return res.status(400).json({ message: "Already processed" });
  }

  if (user.walletBalance < withdrawal.amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  user.walletBalance -= withdrawal.amount;
  withdrawal.status = "approved";

  await user.save();
  await withdrawal.save();

  res.json({ message: "Approved" });
});

router.post("/withdrawals/:id/reject", auth, isAdmin, async (req, res) => {
  const withdrawal = await Withdrawal.findById(req.params.id);
  withdrawal.status = "rejected";
  await withdrawal.save();

  res.json({ message: "Rejected" });
});

module.exports = router;
