const axios = require("axios");

const sendEmail = async (to, subject, html) => {
  try {
    const res = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { email: process.env.SENDER_EMAIL, name: "Remote Pro Jobs" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Email sent:", res.data);
    return true;
  } catch (error) {
    console.error("❌ Email sending error:", error.response?.data || error.message);
    throw new Error("Email sending failed");
  }
};
console.log("🔐 BREVO_API_KEY:", process.env.BREVO_API_KEY ? "Loaded ✅" : "Missing ❌");

module.exports = sendEmail;
