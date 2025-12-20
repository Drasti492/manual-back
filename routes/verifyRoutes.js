// routes/verifyRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/user");

// ✅ Get user verification status
router.get("/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("name email phone verified isManuallyVerified connects");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Manually verify user (Admin)
router.patch("/manual/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isManuallyVerified = true;
    await user.save();

    res.json({ message: `✅ ${user.name} has been manually verified.`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ✅ Optional: Unverify user
router.patch("/unverify/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isManuallyVerified = false;
    await user.save();

    res.json({ message: `❌ ${user.name} has been unverified.`, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
