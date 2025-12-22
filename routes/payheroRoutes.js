const express = require("express");
const axios = require("axios");
const auth = require("../middleware/auth");
const User = require("../models/user");
const Payment = require("../models/Payment");
const router = express.Router();

const CONNECTS_GRANTED = 8;

/**
 * INITIATE STK PUSH
 */
router.post("/stk-push", auth, async (req, res) => {
  try {
    const { phone, amountKES = 1540 } = req.body;  // Default fixed if not sent
    if (!phone) return res.status(400).json({ message: "Phone number is required" });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const payment = await Payment.create({
      user: user._id,
      phone,
      amountKES: Number(amountKES),
      status: "pending"
    });

    const response = await axios.post(
      `${process.env.PAYHERO_BASE_URL}/api/v2/payments`,
      {
        amount: Number(amountKES),
        phone_number: phone.replace(/^0/, "254"),  // Convert 07... → 254... for safety
        channel_id: process.env.PAYHERO_CHANNEL_ID,
        provider: "m-pesa",
        callback_url: process.env.PAYHERO_CALLBACK_URL,
        external_reference: payment._id.toString(),
        customer_name: user.name  // Optional: Add user name
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
 * PAYHERO CALLBACK (UPDATED FOR DOCS EXAMPLE)
 */
router.post("/callback", async (req, res) => {
  try {
    console.log("✅ PAYHERO CALLBACK RECEIVED:", JSON.stringify(req.body, null, 2));  // LOG FULL PAYLOAD FOR DEBUG

    const payload = req.body;

    // Extract external_reference (might be in response.ExternalReference or top-level)
    const externalRef = payload.response?.ExternalReference || payload.ExternalReference || payload.external_reference;
    if (!externalRef) {
      console.error("No external_reference in callback");
      return res.status(400).end();
    }

    const payment = await Payment.findById(externalRef).populate("user");
    if (!payment) return res.status(404).end();

    // Check success: Based on docs example
    const isSuccess = payload.status === true && 
                      payload.response?.Status === "Success" && 
                      payload.response?.ResultCode === 0;

    if (isSuccess) {
      payment.status = "success";
      await payment.save();

      const user = payment.user;
      user.verified = true;
      user.isManuallyVerified = true;
      user.connects += CONNECTS_GRANTED;
      await user.save();

      console.log(`✅ Payment success for user ${user._id} - Verified & +${CONNECTS_GRANTED} connects`);
    } else {
      payment.status = "failed";
      await payment.save();
      console.log("❌ Payment failed/cancelled");
    }

    res.status(200).end();
  } catch (err) {
    console.error("❌ CALLBACK ERROR:", err);
    res.status(500).end();
  }
});

module.exports = router;