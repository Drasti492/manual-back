const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ===============================
    // BASIC PROFILE
    // ===============================
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
      minlength: 6
    },

    // ===============================
    // ACCOUNT STATUS (DUAL SYSTEM)
    // ===============================
    verified: {
      type: Boolean,
      default: false
      // ✅ AUTO-SET TRUE AFTER PAYHERO PAYMENT
    },

    isManuallyVerified: {
      type: Boolean,
      default: false
      // ✅ ADMIN CAN SET THIS MANUALLY
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    // ===============================
    // EMAIL / RESET SYSTEM
    // ===============================
    verificationCode: String,
    verificationCodeExpire: Date,

    resetCode: String,
    resetCodeExpire: Date,

    // ===============================
    // WALLET & CONNECTS
    // ===============================
    walletBalance: {
      type: Number,
      default: 0
      // ✅ ADMIN CAN CREDIT
      // ✅ TASKS CAN CREDIT
      // ❌ WITHDRAWAL DOES NOT AUTO-DEDUCT (PENDING FLOW)
    },

    connects: {
      type: Number,
      default: 0
      // ✅ +8 AFTER PAYHERO PAYMENT
      // ✅ ADMIN CAN ADD / REMOVE
    },

    // ===============================
    // COMPLETED TASKS (COUNTER ONLY)
    // ===============================
    completedTasks: {
      type: Number,
      default: 0
      // ✅ DISPLAYED IN PROFILE & WITHDRAW PAGE
      // ✅ ADMIN / SYSTEM CAN INCREMENT
    },

    // ===============================
    // JOB APPLICATION HISTORY
    // ===============================
    applications: [
      {
        jobId: {
          type: String,
          required: true
        },
        title: String,
        company: String,
        description: String,
        appliedAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true // createdAt & updatedAt
  }
);

// ===============================
// PASSWORD HASHING
// ===============================
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ===============================
// PASSWORD COMPARISON
// ===============================
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
