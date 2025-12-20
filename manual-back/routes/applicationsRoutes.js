// routes/applicationsRoutes.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const auth = require("../middleware/auth");
const User = require("../models/user");

// ======================================================
// POST /api/applications/apply/:jobId
// Apply to a job
// ======================================================
router.post("/apply/:jobId", auth, async (req, res) => {
  try {
    const { jobId } = req.params;
    const { title, company, description } = req.body;

    // Validate input
    if (!jobId || !title || !company) {
      return res.status(400).json({
        success: false,
        message: "Job ID, title and company are required."
      });
    }

    // Fetch user fresh from DB (not req.user)
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    // ======================================================
    // ❗ Prevent duplicate application
    // ======================================================
    const alreadyApplied = user.applications.some(a => a.jobId === jobId);

    if (alreadyApplied) {
      await Notification.create({
        user: user._id,
        title: "Already Applied",
        message: `You already applied for "${title}" at ${company}.`,
        type: "info",
        read: false
      });

      return res.json({
        success: false,
        alreadyApplied: true,
        message: "You have already applied for this job."
      });
    }

    // ======================================================
    // ❗ Check connects
    // ======================================================
    if (user.connects <= 0) {
      await Notification.create({
        user: user._id,
        title: "Not Enough Connects",
        message: "You don’t have enough connects to apply.",
        type: "warning",
        read: false
      });

      return res.status(403).json({
        success: false,
        limitReached: true,
        message: "You don’t have enough connects to apply."
      });
    }

    // Deduct connect
    user.connects -= 1;

    // ======================================================
    // Save application
    // ======================================================
    user.applications.push({
      jobId,
      title,
      company,
      description: description || "",
      appliedAt: new Date()
    });

    await user.save();

    // ======================================================
    // Create success notification
    // ======================================================
    await Notification.create({
      user: user._id,
      title: "Application Submitted",
      message: `You applied for "${title}" at ${company}.`,
      type: "success",
      read: false
    });

    return res.json({
      success: true,
      message: "Application submitted successfully!",
      connectsRemaining: user.connects
    });

  } catch (err) {
    console.error("Apply route error:", err);
    return res.status(500).json({
      success: false,
      message: "Unable to process application. Try again later."
    });
  }
});

module.exports = router;
