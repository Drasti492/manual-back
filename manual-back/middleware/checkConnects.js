// middleware/checkConnects.js
const User = require("../models/user");

module.exports = async function (req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Must have connects to apply
    if (user.connects <= 0) {
      return res.status(403).json({
        requiresUpgrade: true,
        message: "You don't have enough connects to apply."
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error("checkConnects error:", error.message);
    res.status(500).json({ message: "Error checking connects." });
  }
};
