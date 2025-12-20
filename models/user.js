// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    password: { type: String, required: true, minlength: 6 },

    verified: { type: Boolean, default: false },
    isManuallyVerified: { type: Boolean, default: false },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user"
    },

    verificationCode: String,
    verificationCodeExpire: Date,
    resetCode: String,
    resetCodeExpire: Date,

    // ✅ SINGLE BALANCE FIELD
    walletBalance: {
      type: Number,
      default: 0
    },

    connects: {
      type: Number,
      default: 0
    },

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
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
