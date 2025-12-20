const Notification = require('../models/notification'); // Create this model
const User = require('../models/user');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id; // From your auth middleware
        const notifications = await Notification.find({ user: userId }).sort({ date: -1 });
        res.json({ notifications });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.body;
        await Notification.findByIdAndUpdate(notificationId, { read: true });
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
