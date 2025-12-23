const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    amountKES: {
      type: Number,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      default: () => `PAY-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending"
    },

    provider: {
      type: String,
      default: "payhero"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);