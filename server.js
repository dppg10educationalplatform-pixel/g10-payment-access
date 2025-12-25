import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,     // PUBLIC KEY
  key_secret: process.env.RAZORPAY_SECRET // SECRET KEY
});

/* =====================================================
   🔹 CREATE ORDER (MANDATORY FOR SIGNATURE VERIFICATION)
   ===================================================== */
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 100,              // ₹1 = 100 paise
      currency: "INR",
      receipt: "g10_" + Date.now(),
    });

    res.json(order);
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ success: false, message: "Order creation failed" });
  }
});

/* ======================================
   🔹 VERIFY PAYMENT (FINAL & CORRECT)
   ====================================== */
app.post("/verify-payment", (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  } = req.body;

  // Safety check
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ success: false });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("✅ Server running on port " + PORT);
});
