const nodemailer = require("nodemailer");

exports.createOrder = async (req, res) => {
  try {
    const { name, address, city, phone, email } = req.body;

    if (!name || !address || !city || !phone || !email) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // === 1️⃣  Send confirmation emails ===
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // your Gmail App Password
      },
    });

    const adminMail = {
      from: `"Beauty Store" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Send to you (admin)
      subject: `🛍️ New Order from ${name}`,
      html: `
        <h3>New Order Received</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>City:</strong> ${city}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><em>Check WhatsApp to confirm with the client.</em></p>
      `,
    };

    const clientMail = {
      from: `"Beauty Store" <${process.env.EMAIL_USER}>`,
      to: email, // Send to client
      subject: "Order Confirmation - Beauty Store",
      html: `
        <h3>Thank you, ${name}!</h3>
        <p>Your order has been received and is being processed.</p>
        <p>We'll reach out to confirm your delivery shortly.</p>
        <p><strong>Delivery Info:</strong><br>
        ${address}, ${city}</p>
        <p>For faster assistance, contact us on WhatsApp.</p>
      `,
    };

    await transporter.sendMail(adminMail);
    await transporter.sendMail(clientMail);

    // === 2️⃣  WhatsApp redirect link ===
    const whatsappNumber = "2"; // Your WhatsApp (no +, just country code)
    const whatsappMessage = encodeURIComponent(
      `Hello Beauty Store, I have just placed my order under the name ${name}.`
    );

    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

    res.status(200).json({
      message: "Order submitted successfully!",
      redirect: whatsappURL,
    });
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ message: "Failed to submit order" });
  }
};
