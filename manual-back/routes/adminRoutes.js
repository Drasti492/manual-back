const express = require("express");
const router = express.Router();
const User = require("../models/user");
const Notification = require("../models/notification");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

// ✅ Admin manually verifies user
router.post("/verify-user/:email", auth, admin, async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.isManuallyVerified = true;
    user.verified = true;

    await user.save();

    await Notification.create({
      user: user._id,
      title: "Account Verified",
      message: "Your account has been verified. You now have full access.",
      type: "info",
      read: false
    });

    res.json({
      success: true,
      message: `✅ ${email} has been manually verified`,
      user
    });

  } catch (error) {
    console.error("Admin verify-user error:", error);
    res.status(500).json({ message: "Failed to verify user" });
  }
});

module.exports = router;
