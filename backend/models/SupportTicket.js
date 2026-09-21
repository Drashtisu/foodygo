import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false,
      default: null,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    deliveryBoyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    issueType: {
      type: String,
      enum: [
        "GENERAL_INQUIRY",
        "PAYMENT_ISSUE",
        "NOT_REACHED_LOCATION",
        "WRONG_ADDRESS",
        "FOOD_DAMAGED",
        "DELAYED_DELIVERY",
        "OTHER",
      ],
      default: "GENERAL_INQUIRY",
    },
    subject: {
      type: String,
      default: "Customer Support Inquiry",
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    contactEmail: {
      type: String,
      trim: true,
      default: null,
    },
    contactPhone: {
      type: String,
      trim: true,
      default: null,
    },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "RESOLVED", "ORDER_CANCELLED"],
      default: "OPEN",
    },
    actionTaken: {
      type: String,
      default: null,
    },
    refundProcessed: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const SupportTicket = mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
