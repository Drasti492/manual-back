// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    phone: {
      type: String,
      required: true,
      trim: true
    },

    password: {
      type: String,
      required: true,
      minlength: 6 // ✅ SIMPLE PASSWORD RULE
    },

    // ===============================
    // ACCOUNT STATUS
    // ===============================
    verified: {
      type: Boolean,
      default: false
    },

    isManuallyVerified: {
      type: Boolean,
      default: false
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    // ===============================
    // VERIFICATION / RESET
    // ===============================
    verificationCode: String,
    verificationCodeExpire: Date,

    resetCode: String,
    resetCodeExpire: Date,

    // ===============================
    // MANUAL SYSTEM (NO PAYMENTS)
    // ===============================
    walletBalance: {
      type: Number,
      default: 0 // 💰 ADMIN CAN CREDIT MANUALLY
    },

    connects: {
      type: Number,
      default: 0 // 🔗 ADMIN CAN ADD CONNECTS
    },

    // ===============================
    // COMPLETED TASKS (ADDED – SAFE)
    // ===============================
    completedTasks: [
      {
        title: {
          type: String,
          required: true
        },
        reward: {
          type: Number,
          default: 0
        },
        completedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ===============================
    // WITHDRAWAL HISTORY (OPTIONAL MIRROR)
    // ===============================
    withdrawalHistory: [
      {
        amount: Number,
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending"
        },
        note: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // ===============================
    // APPLICATION HISTORY
    // ===============================
    applications: [
      {
        jobId: { type: String, required: true },
        title: String,
        company: String,
        description: String,
        appliedAt: { type: Date, default: Date.now }
      }
    ]
  },
  {
    timestamps: true // ✅ createdAt & updatedAt
  }
);

// ===============================
// HASH PASSWORD
// ===============================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ===============================
// COMPARE PASSWORD
// ===============================
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
