require("dotenv").config();
const User = require("../models/user");
const Notification = require("../models/notification");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");


// ===============================
// REGISTER
// ===============================
exports.register = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // 🔐 Password rule

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Send verification email
    await sendEmail(
      email,
      "Verify Your Email",
      `
      <h3>Email Verification</h3>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>This code expires in 10 minutes.</p>
    `
    );

    const user = new User({
      name,
      email,
      phone,
      password,
      verified: false,
      isManuallyVerified: false
    });

    user.verificationCode = code;
    user.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    // Welcome notification
    await Notification.create({
      user: user._id,
      title: "Welcome to RemoteProJobs",
      message:
        "Your account has been created. Please verify your email to continue.",
      read: false
    });

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      email // 👈 frontend stores this
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// ===============================
// RESEND VERIFICATION CODE (🔥 FIX)
// ===============================
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (user.verified) {
      return res.status(400).json({ message: "Email already verified." });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.verificationCode = code;
    user.verificationCodeExpire = Date.now() + 10 * 60 * 1000;
    await user.save();

    await sendEmail(
      email,
      "Resend Verification Code",
      `
      <h3>Email Verification</h3>
      <p>Your new verification code:</p>
      <h2>${code}</h2>
      <p>Expires in 10 minutes.</p>
    `
    );

    res.json({ message: "Verification code resent successfully." });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: "Failed to resend verification code." });
  }
};

// ===============================
// VERIFY EMAIL CODE
// ===============================
exports.verifyCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Account not found." });

    if (
      !user.verificationCode ||
      Date.now() > user.verificationCodeExpire
    ) {
      return res.status(400).json({ message: "Verification code expired." });
    }

    if (user.verificationCode !== code) {
      return res.status(400).json({ message: "Invalid verification code." });
    }

    user.verified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save();

    res.json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Verify error:", err);
    res.status(500).json({ message: "Verification failed." });
  }
};

// ===============================
// LOGIN
// ===============================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!user.verified) {
      return res.status(403).json({ message: "Please verify your email." });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Login failed." });
  }
};

// ===============================
// GET LOGGED-IN USER
// ===============================
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -verificationCode -verificationCodeExpire"
    );

    if (!user) return res.status(404).json({ message: "User not found." });

    res.json({ success: true, user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(500).json({ message: "Failed to fetch user." });
  }
};

// ===============================
// LOGOUT (STATeless)
// ===============================
exports.logout = (req, res) => {
  res.json({ message: "Logout successful." });
};


// ===============================
// FORGOT PASSWORD
// ===============================
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // SECURITY: never reveal account existence
    if (!user) {
      return res.json({
        message: "If the email exists, a reset code has been sent."
      });
    }

    const code = user.createResetCode();
    await user.save();

    await sendEmail(
      email,
      "Reset Your Password",
      `
        <h3>Password Reset</h3>
        <p>Your password reset code is:</p>
        <h2>${code}</h2>
        <p>This code expires in 10 minutes.</p>
      `
    );

    res.json({
      message: "If the email exists, a reset code has been sent."
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Failed to process request." });
  }
};




// ===============================
// RESET PASSWORD
// ===============================
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (
      !user.resetCode ||
      Date.now() > user.resetCodeExpire
    ) {
      return res.status(400).json({ message: "Reset code expired." });
    }

    if (user.resetCode !== code) {
      return res.status(400).json({ message: "Invalid reset code." });
    }

    user.password = newPassword; // hashed by pre-save hook
    user.resetCode = undefined;
    user.resetCodeExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful." });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Password reset failed." });
  }
};
