import Order, { ORDER_STATUS } from "../../../models/Order.js";
import User from "../../../models/User.js";
import Restaurant from "../../../models/Restaurant.js";

export const getOrderDetails = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name email phone")
      .populate("restaurantId", "name address phone cuisine")
      .populate("deliveryBoyId", "name phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const userId = req.user._id.toString();
    const isCustomer = order.customerId?._id?.toString() === userId;
    const isDelivery = order.deliveryBoyId?._id?.toString() === userId;
    const isSupport = req.user.role === "support";
    const isRestaurantOwner = req.user.role === "restaurant";

    if (!isCustomer && !isDelivery && !isSupport && !isRestaurantOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const trackOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("customerId", "name phone")
      .populate("restaurantId", "name address phone")
      .populate("deliveryBoyId", "name phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const milestones = [
      { key: ORDER_STATUS.PENDING_PAYMENT, label: "choose payment option & payment gateway" },
      { key: ORDER_STATUS.CONFIRMED, label: "payment success -> payment invoice -> order confirmed" },
      { key: ORDER_STATUS.ACCEPTED, label: "restaurant service -> accept order" },
      { key: ORDER_STATUS.PREPARING, label: "food preparing" },
      { key: ORDER_STATUS.FOOD_READY, label: "food ready" },
      { key: ORDER_STATUS.DELIVERY_ASSIGNED, label: "delivery service -> assigned delivery boy" },
      { key: ORDER_STATUS.DELIVERY_ACCEPTED, label: "delivery partner accepted" },
      { key: ORDER_STATUS.GOING_TO_RESTAURANT, label: "go to restaurant" },
      { key: ORDER_STATUS.PICKED_UP, label: "take food from restaurant" },
      { key: ORDER_STATUS.OUT_FOR_DELIVERY, label: "food out from the delivery" },
      { key: ORDER_STATUS.REACHED_CUSTOMER_LOCATION, label: "reached customer location" },
    ];

    const historyStatuses = order.statusHistory.map((h) => h.status);

    const timeline = milestones.map((m) => {
      const historyEntry = order.statusHistory.find((h) => h.status === m.key);
      const isCompleted = historyStatuses.includes(m.key);
      const isCurrent = order.orderStatus === m.key;

      return {
        milestone: m.label,
        statusKey: m.key,
        state: isCurrent ? "CURRENT" : isCompleted ? "COMPLETED" : "PENDING",
        timestamp: historyEntry ? historyEntry.timestamp : null,
        note: historyEntry ? historyEntry.note : null,
      };
    });

    if (
      order.orderStatus === ORDER_STATUS.HANDOVER ||
      order.orderStatus === ORDER_STATUS.DELIVERED
    ) {
      timeline.push({
        milestone: "handover",
        statusKey: ORDER_STATUS.HANDOVER,
        state: "COMPLETED",
      });
      timeline.push({
        milestone: "order successfully deliverd",
        statusKey: ORDER_STATUS.DELIVERED,
        state: order.orderStatus === ORDER_STATUS.DELIVERED ? "COMPLETED" : "PENDING",
      });
      timeline.push({
        milestone: "rating /views",
        statusKey: "REVIEW",
        state: "READY_FOR_FEEDBACK",
      });
    } else if (
      order.orderStatus === ORDER_STATUS.DELIVERY_ISSUE ||
      order.orderStatus === ORDER_STATUS.CANCELLED
    ) {
      timeline.push({
        milestone: "not reached to the location",
        statusKey: ORDER_STATUS.DELIVERY_ISSUE,
        state: "FLAGGED",
      });
      timeline.push({
        milestone: "customer support",
        statusKey: "SUPPORT_ESCALATED",
        state: "IN_PROGRESS",
      });
      timeline.push({
        milestone: "cancel order",
        statusKey: ORDER_STATUS.CANCELLED,
        state: order.orderStatus === ORDER_STATUS.CANCELLED ? "COMPLETED" : "PENDING",
      });
    }

    res.status(200).json({
      success: true,
      flowStep: "order tracking",
      currentStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      orderNumber: order.orderNumber,
      timeline,
      statusHistory: order.statusHistory,
    });
  } catch (error) {
    next(error);
  }
};

export const getCustomerOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate("restaurantId", "name address phone")
      .populate("deliveryBoyId", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    let filter = {};
    if (status) filter.orderStatus = status;

    const orders = await Order.find(filter)
      .populate("customerId", "name email phone")
      .populate("restaurantId", "name address")
      .populate("deliveryBoyId", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};
