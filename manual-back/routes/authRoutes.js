const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/auth");

// AUTH
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// PASSWORD
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword);

// EMAIL VERIFICATION
router.post("/verify-code", authController.verifyCode);
router.post("/resend-verification", authController.resendVerification);

// USER
router.get("/user", authMiddleware, authController.getUser);

module.exports = router;
