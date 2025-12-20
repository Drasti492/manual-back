const express = require("express");
const router = express.Router();
const Notification = require("../models/notification");
const auth = require("../middleware/auth");

// GET all notifications for logged-in user
router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(notifications);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch notifications." });
    }
});

// PATCH mark notification as read
router.patch("/:id/read", auth, async (req, res) => {
    try {
        await Notification.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ message: "Notification marked as read." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update notification." });
    }
});

// PATCH mark all as read
router.patch("/mark-all-read", auth, async (req, res) => {
    try {
        await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
        res.json({ message: "All notifications marked as read." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update notifications." });
    }
});

// DELETE a notification
router.delete("/:id", auth, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: "Notification deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete notification." });
    }
});

// DELETE all notifications
router.delete("/", auth, async (req, res) => {
    try {
        await Notification.deleteMany({ user: req.user._id });
        res.json({ message: "All notifications deleted." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete notifications." });
    }
});

module.exports = router;