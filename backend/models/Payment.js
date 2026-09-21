import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING", "COD", "WALLET"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    failureReason: {
      type: String,
      default: null,
    },
    refundStatus: {
      type: String,
      enum: ["NONE", "INITIATED", "COMPLETED"],
      default: "NONE",
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
