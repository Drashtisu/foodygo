import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipientRole: {
      type: String,
      enum: ["customer", "restaurant", "delivery", "support"],
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "ORDER_CONFIRMED",
        "ORDER_ACCEPTED",
        "FOOD_PREPARING",
        "FOOD_READY",
        "DELIVERY_ASSIGNED",
        "OUT_FOR_DELIVERY",
        "DELIVERY_ARRIVED",
        "ORDER_DELIVERED",
        "DELIVERY_ISSUE",
        "ORDER_CANCELLED",
        "SUPPORT_UPDATE",
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;
