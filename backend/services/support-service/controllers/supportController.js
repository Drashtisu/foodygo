import SupportTicket from "../../../models/SupportTicket.js";
import Order, { ORDER_STATUS } from "../../../models/Order.js";
import Notification from "../../../models/Notification.js";
import Payment from "../../../models/Payment.js";
import { dispatchNotification } from "../../../shared/utils/notificationDispatcher.js";

const generateTicketNumber = () =>
  `TKT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

export const getCustomerServiceInfo = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      flowStep: "customer service",
      data: {
        company: "FoodyGo",
        tagline: "Fast, Fresh & Reliable Food Delivery",
        contact: {
          helpline: "+1-800-FOODY-GO (+1-800-366-3946)",
          email: "support@foodygo.com",
          liveChat: "Available 24/7 in app",
          hours: "24 hours a day, 7 days a week",
        },
        faqs: [
          {
            question: "How do I place an order?",
            answer:
              "Register/login, search for restaurants, browse menu, add items to cart, select address, and proceed through 2-way payment.",
          },
          {
            question: "What payment methods are supported?",
            answer: "UPI, Debit/Credit Card, Net Banking, Wallet, and Cash on Delivery (COD).",
          },
          {
            question: "What happens if my delivery partner cannot reach my location?",
            answer:
              "The delivery partner will flag 'not reached location'. Customer Support will immediately intervene to contact you or cancel the order with full refund.",
          },
          {
            question: "How do refunds work upon order cancellation?",
            answer:
              "Once cancelled by Customer Support, refunds are credited back to your original payment method automatically.",
          },
        ]
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createTicket = async (req, res, next) => {
  try {
    const { orderId, issueType, subject, description, contactEmail, contactPhone } =
      req.body;

    if (!description) {
      return res.status(400).json({
        success: false,
        message: "Please provide an issue description",
      });
    }

    let order = null;
    let customerId = req.user ? req.user._id : null;
    let deliveryBoyId = null;

    if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found",
        });
      }
      customerId = customerId || order.customerId;
      deliveryBoyId = order.deliveryBoyId;
    }

    const ticket = await SupportTicket.create({
      ticketNumber: generateTicketNumber(),
      orderId: order ? order._id : null,
      customerId,
      deliveryBoyId,
      issueType: issueType || (order ? "NOT_REACHED_LOCATION" : "GENERAL_INQUIRY"),
      subject: subject || (order ? `Order Issue #${order.orderNumber}` : "General Support Inquiry"),
      description,
      contactEmail: contactEmail || (req.user ? req.user.email : null),
      contactPhone: contactPhone || (req.user ? req.user.phone : null),
      status: "OPEN",
    });

    res.status(201).json({
      success: true,
      flowStep: "customer support",
      message: "Customer support ticket opened successfully",
      data: ticket,
    
    });
  } catch (error) {
    next(error);
  }
};

export const getTickets = async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === "customer") {
      filter.customerId = req.user._id;
    } else if (req.user.role === "delivery") {
      filter.deliveryBoyId = req.user._id;
    }

    const tickets = await SupportTicket.find(filter)
      .populate("orderId", "orderNumber orderStatus totalAmount paymentStatus")
      .populate("customerId", "name email phone")
      .populate("deliveryBoyId", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (error) {
    next(error);
  }
};

export const getTicketById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let filter = id.startsWith("TKT-") ? { ticketNumber: id } : { _id: id };

    const ticket = await SupportTicket.findOne(filter)
      .populate("orderId")
      .populate("customerId", "name email phone")
      .populate("deliveryBoyId", "name phone");

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Support ticket not found",
      });
    }

    if (
      req.user.role !== "support" &&
      ticket.customerId &&
      ticket.customerId._id.toString() !== req.user._id.toString() &&
      ticket.deliveryBoyId &&
      ticket.deliveryBoyId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this support ticket",
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelOrderFromSupport = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const {
      reason = "Delivery location not reachable / Customer requested cancellation via support",
    } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus === ORDER_STATUS.DELIVERED) {
      return res.status(400).json({
        success: false,
        message: "Delivered orders cannot be cancelled",
      });
    }

    if (order.orderStatus === ORDER_STATUS.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    let refundProcessed = false;
    if (order.paymentStatus === "PAID") {
      refundProcessed = true;
      order.paymentStatus = "REFUNDED";

      await Payment.findOneAndUpdate(
        { orderId: order._id, paymentStatus: "SUCCESS" },
        {
          paymentStatus: "REFUNDED",
          refundStatus: "COMPLETED",
          refundAmount: order.totalAmount,
          refundedAt: new Date(),
        }
      );
    }

    order.cancellationReason = reason;
    order.updateStatus(
      ORDER_STATUS.CANCELLED,
      `Order cancelled via support: ${reason}.${
        refundProcessed ? ` Refund of ₹${order.totalAmount} processed.` : ""
      }`
    );
    await order.save();

    await SupportTicket.findOneAndUpdate(
      { orderId: order._id, status: { $ne: "RESOLVED" } },
      {
        status: "ORDER_CANCELLED",
        actionTaken: `Order cancelled and refund of ₹${order.totalAmount} marked as completed.`,
        refundProcessed,
      }
    );

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Order Cancelled & Refunded",
      message: `Your order #${order.orderNumber} has been cancelled. ${
        refundProcessed
          ? `Full refund of ₹${order.totalAmount} has been processed to your original payment method.`
          : ""
      }`,
      type: "ORDER_CANCELLED",
    });

    res.status(200).json({
      success: true,
      flowStep: "cancel order",
      message: "Order cancelled successfully via customer support",
      data: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        cancellationReason: order.cancellationReason,
        refundInitiated: refundProcessed,
        refundAmount: refundProcessed ? order.totalAmount : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};
