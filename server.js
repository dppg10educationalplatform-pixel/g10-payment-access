import express from "express";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import Razorpay from "razorpay";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_SECRET,
});

// 🔹 CREATE ORDER (MANDATORY)
app.post("/create-order", async (req, res) => {
  try {
    const order = await razorpay.orders.create({
      amount: 100, // ₹1
      currency: "INR",
      receipt: "g10_" + Date.now(),
    });
    res.json(order);
  } catch {
    res.status(500).json({ error: "Order creation failed" });
  }
});

// 🔹 VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_SECRET)
    .update(body)
    .digest("hex");

  res.json({ success: expectedSignature === razorpay_signature });
});

app.listen(process.env.PORT || 3000, () =>
  console.log("✅ Server running")
);
