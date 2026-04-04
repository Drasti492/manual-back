// ------------------------------------
// Global Error Handlers
// ------------------------------------
process.on("uncaughtException", (err) => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

// ------------------------------------
// Environment Variables
// ------------------------------------
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const Brevo = require("@getbrevo/brevo");

const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;

// Exit if Mongo URI is missing
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is missing!");
  process.exit(1);
}

// ------------------------------------
// Express App Setup
// ------------------------------------
const app = express();

// ------------------------------------
// Middleware
// ------------------------------------
app.use(express.json());

// ------------------------------------
// CORS Configuration
// ------------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5500",
  "https://remote-projobs.vercel.app",
  "https://remoteprojobs.site"
];

const corsOptions = {
  origin: (origin, callback) => {
    // allow server-to-server requests
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) return callback(null, true);

    console.error("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};

app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options("*", cors(corsOptions));

// ------------------------------------
// MongoDB Strict Mode
// ------------------------------------
mongoose.set("strictQuery", true);

// ------------------------------------
// Import Routes
// ------------------------------------
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const applicationsRoutes = require("./routes/applicationsRoutes");
const notificationsRoutes = require("./routes/notificationsRoutes");
const verifyRoutes = require("./routes/verifyRoutes");
const adminRoutes = require("./routes/adminRoutes");
const withdrawalRoutes = require("./routes/withdrawalRoutes");
const adminWithdrawalRoutes = require("./routes/adminWithdrawalRoutes");
const payheroRoutes = require("./routes/payheroRoutes");

// ------------------------------------
// Attach Routes with error logging
// ------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/verify", verifyRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/withdrawals", withdrawalRoutes);
app.use("/api/admin/withdrawals", adminWithdrawalRoutes);
app.use("/api/payhero", payheroRoutes);

// Catch all for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL ERROR:", err);
  res.status(500).json({ message: "Internal Server Error", error: err.message });
});

// ------------------------------------
// Brevo Email Setup
// ------------------------------------
const brevo = new Brevo.TransactionalEmailsApi();
brevo.authentications["apiKey"].apiKey = process.env.BREVO_API_KEY;

// Example Order Endpoint
app.post("/api/order", async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, cart, total } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ message: "Cart is empty." });
    }

    const orderItemsHtml = cart
      .map(
        (item) => `
        <li>
          <strong>${item.name}</strong> — Ksh ${item.price} × ${item.quantity}<br>
          <small>${item.description || ""}</small>
        </li>`
      )
      .join("");

    // Admin email
    const adminEmail = new Brevo.SendSmtpEmail();
    adminEmail.sender = { email: "no-reply@yourdomain.com", name: "Your Shop" };
    adminEmail.to = [{ email: "youremail@example.com", name: "Store Admin" }];
    adminEmail.subject = `🛒 New Order from ${customerName}`;
    adminEmail.htmlContent = `
      <h2>New Order Received</h2>
      <p><strong>Name:</strong> ${customerName}</p>
      <p><strong>Email:</strong> ${customerEmail}</p>
      <p><strong>Phone:</strong> ${customerPhone}</p>
      <h3>Order Details:</h3>
      <ul>${orderItemsHtml}</ul>
      <h3>Total: Ksh ${total.toFixed(2)}</h3>
    `;
    await brevo.sendTransacEmail(adminEmail);

    // Customer email
    const clientEmail = new Brevo.SendSmtpEmail();
    clientEmail.sender = { email: "no-reply@yourdomain.com", name: "Your Shop" };
    clientEmail.to = [{ email: customerEmail, name: customerName }];
    clientEmail.subject = "✅ Order Confirmation - Your Purchase Summary";
    clientEmail.htmlContent = `
      <h2>Hi ${customerName},</h2>
      <p>Thank you for your order! Here is your summary:</p>
      <ul>${orderItemsHtml}</ul>
      <p><strong>Total:</strong> Ksh ${total.toFixed(2)}</p>
      <p>We will contact you soon for delivery.</p>
    `;
    await brevo.sendTransacEmail(clientEmail);

    const whatsappUrl = `https://wa.me/254?text=Hi%20${encodeURIComponent(
      customerName
    )},%20thank%20you%20for%20your%20order%20of%20Ksh%20${total.toFixed(2)}%20from%20Your%20Shop.`;

    res.status(200).json({
      message: "Order notification sent successfully.",
      whatsappRedirect: whatsappUrl
    });
  } catch (error) {
    console.error(" ORDER ERROR:", error);
    res.status(500).json({ message: "Failed to send order email", error: error.message });
  }
});

// ------------------------------------
// MongoDB Connection + Start Server
// ------------------------------------
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB FULL ERROR:", err);
    process.exit(1);
  });

module.exports = app;