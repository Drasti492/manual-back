const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

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
      // ✅ TRUE after email verification OR payment verification
    },

    isManuallyVerified: {
      type: Boolean,
      default: false
      // ✅ Admin-controlled verification
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    accountStatus: {
      type: String,
      enum: ["regular", "premium"],
      default: "regular"
    },

    // ===============================
    // EMAIL VERIFICATION & RESET
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
    },

    connects: {
      type: Number,
      default: 0
    },

    // ===============================
    // COMPLETED TASKS
    // ===============================
    completedTasks: {
      type: Number,
      default: 0
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
    timestamps: true
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

// ===============================
// SECURE RESET CODE GENERATOR
// ===============================
userSchema.methods.createResetCode = function () {
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  this.resetCode = crypto
    .createHash("sha256")
    .update(code)
    .digest("hex");

  this.resetCodeExpire = Date.now() + 10 * 60 * 1000; // 10 minutes

  return code; // return plain code for email
};

module.exports = mongoose.model("User", userSchema);
