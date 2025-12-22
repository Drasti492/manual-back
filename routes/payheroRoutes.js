const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const User = require("../models/user");
const Payment = require("../models/Payment");
const router = express.Router();

const PAYMENT_AMOUNT_KES = 1540;
const CONNECTS_GRANTED = 8;

/**
 * INITIATE STK PUSH
 */
router.post("/stk-push", auth, async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const payment = await Payment.create({
      user: user._id,
      phone,
      amountKES: PAYMENT_AMOUNT_KES,
      status: "pending"
    });

  console.log("🔁 PAYHERO CALLBACK URL:", process.env.PAYHERO_CALLBACK_URL);


    const response = await axios.post(
      `${process.env.PAYHERO_BASE_URL}/v1/payments/stk-push`,
      {
        amount: PAYMENT_AMOUNT_KES,
        phone_number: phone,
        channel_id: process.env.PAYHERO_CHANNEL_ID,
        provider: "m-pesa",
        callback_url: process.env.PAYHERO_CALLBACK_URL,
        external_reference: payment._id.toString()
      },
      {
        headers: {
          Authorization: `Basic ${process.env.PAYHERO_BASIC_AUTH}`,
          "Content-Type": "application/json"
        }
      }
    );

    res.json({
      success: true,
      message: "STK Push sent successfully",
      payhero: response.data
    });

  } catch (err) {
    console.error("❌ STK PUSH ERROR:", err.response?.data || err.message);
    res.status(500).json({
      message: "Failed to initiate STK Push",
      error: err.response?.data || err.message
    });
  }
});

/**
 * PAYHERO CALLBACK
 */
router.post("/callback", async (req, res) => {
  try {
    const { external_reference, status } = req.body;

    const payment = await Payment.findById(external_reference).populate("user");
    if (!payment) return res.status(404).end();

    if (status === "success") {
      payment.status = "success";
      await payment.save();

      const user = payment.user;
      user.verified = true;
      user.isManuallyVerified = true;
      user.connects += CONNECTS_GRANTED;

      await user.save();
    } else {
      payment.status = "failed";
      await payment.save();
    }

    res.status(200).end();
  } catch (err) {
    console.error("❌ CALLBACK ERROR:", err);
    res.status(500).end();
  }
});

module.exports = router;
