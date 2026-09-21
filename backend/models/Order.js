import mongoose from "mongoose";

export const ORDER_STATUS = {
  PENDING_PAYMENT: "PENDING_PAYMENT",
  CONFIRMED: "CONFIRMED",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  FOOD_READY: "FOOD_READY",
  DELIVERY_ASSIGNED: "DELIVERY_ASSIGNED",
  DELIVERY_ACCEPTED: "DELIVERY_ACCEPTED",
  GOING_TO_RESTAURANT: "GOING_TO_RESTAURANT",
  PICKED_UP: "PICKED_UP",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  REACHED_CUSTOMER_LOCATION: "REACHED_CUSTOMER_LOCATION",
  DELIVERY_ISSUE: "DELIVERY_ISSUE",
  HANDOVER: "HANDOVER",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
};

const orderItemSchema = new mongoose.Schema({
  menuItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MenuItem",
    required: true,
  },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    items: [orderItemSchema],
    deliveryAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      
    },
    subtotal: {
      type: Number,
      required: true,
    },
    deliveryFee: {
      type: Number,
      default: 40,
    },
    tax: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentOption: {
      type: String,
      enum: ["UPI", "CARD", "NETBANKING", "COD", "WALLET"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    orderStatus: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING_PAYMENT,
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: "" },
      },
    ],
    cancellationReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.methods.updateStatus = function (newStatus, note = "") {
  this.orderStatus = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),  
    note,
  });
};

const Order = mongoose.model("Order", orderSchema);
console.log(Order)
export default Order;
