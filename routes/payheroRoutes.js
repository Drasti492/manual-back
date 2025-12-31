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
    const { phone, amountKES = 1540 } = req.body;

    if (!phone) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const payment = await Payment.create({
      user: user._id,
      phone,
      amountKES: Number(amountKES),
      status: "pending"
    });

    console.log(`🚀 Initiating STK Push | Ref: ${payment.reference} | Phone: ${phone}`);

    const response = await axios.post(
      `${process.env.PAYHERO_BASE_URL}/api/v2/payments`,
      {
        amount: Number(amountKES),
        phone_number: phone,
        channel_id: Number(process.env.PAYHERO_CHANNEL_ID),
        provider: "m-pesa",
        external_reference: payment.reference,
        callback_url: process.env.PAYHERO_CALLBACK_URL,
        customer_name: user.name || "RemoteProJobs User"
      },
      {
        headers: {
          Authorization: `Basic ${process.env.PAYHERO_BASIC_AUTH}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ PayHero response:", response.data);

    res.json({
      success: true,
      paymentId: payment._id,
      reference: payment.reference  // ← Return reference
    });

  } catch (err) {
    console.error("❌ STK PUSH ERROR:", err.response?.data || err.message);
    res.status(500).json({ message: "Failed to initiate payment." });
  }
});

/**
 * PAYHERO CALLBACK
 */
router.post("/callback", async (req, res) => {
  try {
    console.log("✅ PAYHERO CALLBACK RECEIVED:", JSON.stringify(req.body, null, 2));

    const externalRef = req.body?.response?.ExternalReference;

    if (!externalRef) {
      console.error("❌ No ExternalReference");
      return res.sendStatus(400);
    }

    const payment = await Payment.findOne({ reference: externalRef }).populate("user");

    if (!payment) {
      console.error("❌ Payment not found for ref:", externalRef);
      return res.sendStatus(404);
    }

    const resultCode = req.body.response?.ResultCode;

    if (resultCode === 0) {
      payment.status = "success";
      await payment.save();

      const user = payment.user;
      if (user) {
        user.verified = true;
        user.isManuallyVerified = true;
        user.connects += CONNECTS_GRANTED;
        await user.save();
      }

      console.log(`✅ SUCCESS: ${payment.reference}`);
    } else {
      payment.status = "failed";
      await payment.save();
      console.log(`❌ FAILED: ${payment.reference} | Code: ${resultCode}`);
    }

    res.sendStatus(200);

  } catch (err) {
    console.error("❌ CALLBACK ERROR:", err);
    res.sendStatus(500);
  }
});

/**
 * POLLING BY REFERENCE
 */
router.get("/status/:reference", auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ reference: req.params.reference });

    if (!payment || payment.user.toString() !== req.user._id.toString()) {
      return res.json({ status: "not_found" });
    }

    res.json({ status: payment.status });
  } catch (err) {
    console.error("Status error:", err);
    res.json({ status: "error" });
  }
});

module.exports = router;