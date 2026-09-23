import Order, { ORDER_STATUS } from "../../../models/Order.js";
import User from "../../../models/User.js";
import Notification from "../../../models/Notification.js";
import SupportTicket from "../../../models/SupportTicket.js";
import { dispatchNotification } from "../../../shared/utils/notificationDispatcher.js";
import { publishDeliveryEvent } from "../kafka/producer.js";
import { KAFKA_EVENTS } from "../../../shared/constants/topics.js";

const verifyDeliveryPartner = (order, user) => {
  if (user.role === "support") return true;
  if (!order.deliveryBoyId) return false;
  return order.deliveryBoyId.toString() === user._id.toString();
};

export const getAvailableOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({
      orderStatus: {
        $in: [ORDER_STATUS.FOOD_READY, ORDER_STATUS.DELIVERY_ASSIGNED],
      },
    })
      .populate("restaurantId", "name address phone")
      .populate("customerId", "name phone")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      flowStep: "delivery serivce",
      count: orders.length,
      data: orders,
    
    });
  } catch (error) {
    next(error);
  }
};

export const getMyDeliveries = async (req, res, next) => {
  try {
    const { activeOnly } = req.query;
    let filter = { deliveryBoyId: req.user._id };

    if (activeOnly === "true") {
      filter.orderStatus = {
        $in: [
          ORDER_STATUS.DELIVERY_ASSIGNED,
          ORDER_STATUS.DELIVERY_ACCEPTED,
          ORDER_STATUS.GOING_TO_RESTAURANT,
          ORDER_STATUS.PICKED_UP,
          ORDER_STATUS.OUT_FOR_DELIVERY,
          ORDER_STATUS.REACHED_CUSTOMER_LOCATION,
          ORDER_STATUS.HANDOVER,
        ],
      };
    }

    const orders = await Order.find(filter)
      .populate("restaurantId", "name address phone")
      .populate("customerId", "name phone")
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

export const assignDeliveryBoy = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let { deliveryBoyId } = req.body || {};

    if (!deliveryBoyId && req.user.role === "delivery") {
      deliveryBoyId = req.user._id;
    }

    if (!deliveryBoyId) {
      const availableBoy = await User.findOne({
        role: "delivery",
        isActive: true,
      });
      if (!availableBoy) {
        return res.status(404).json({
          success: false,
          message: "No delivery boy available at this moment",
        });
      }
      deliveryBoyId = availableBoy._id;
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.orderStatus !== ORDER_STATUS.FOOD_READY &&
      order.orderStatus !== ORDER_STATUS.PREPARING &&
      order.orderStatus !== ORDER_STATUS.DELIVERY_ASSIGNED
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot assign delivery boy in status '${order.orderStatus}'. Must be FOOD_READY or PREPARING.`,
      });
    }

    order.deliveryBoyId = deliveryBoyId;
    order.updateStatus(
      ORDER_STATUS.DELIVERY_ASSIGNED,
      `Assigned to delivery boy (ID: ${deliveryBoyId}). Waiting for partner acceptance.`
    );
    await order.save();

    await dispatchNotification({
      recipientId: deliveryBoyId,
      recipientRole: "delivery",
      orderId: order._id,
      title: "New Delivery Assigned!",
      message: `Order #${order.orderNumber} has been assigned to you. Please accept to proceed.`,
      type: "DELIVERY_ASSIGNED",
    });

    // Publish Kafka delivery event
    await publishDeliveryEvent(KAFKA_EVENTS.DELIVERY_ASSIGNED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryBoyId,
      customerId: order.customerId,
    });

    res.status(200).json({
      success: true,
      flowStep: "assigned delivery boy",
      message: "Delivery boy assigned successfully",
      data: order,
     
    });
  } catch (error) {
    next(error);
  }
};

export const acceptDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.DELIVERY_ASSIGNED) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be accepted in status '${order.orderStatus}'. Must be '${ORDER_STATUS.DELIVERY_ASSIGNED}'`,
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    order.updateStatus(
      ORDER_STATUS.DELIVERY_ACCEPTED,
      "Delivery partner accepted the order."
    );
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Delivery Partner Assigned",
      message: `${req.user.name} has accepted your delivery and is on their way to the restaurant.`,
      type: "DELIVERY_ASSIGNED",
    });

    // Publish Kafka delivery event
    await publishDeliveryEvent(KAFKA_EVENTS.DELIVERY_ACCEPTED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryBoyId: req.user._id,
      customerId: order.customerId,
    });

    res.status(200).json({
      success: true,
      flowStep: "accept",
      message: "Delivery accepted by delivery partner",
      data: order,
     
    });
  } catch (error) {
    next(error);
  }
};

export const declineDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason = "Delivery partner unavailable" } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.DELIVERY_ASSIGNED) {
      return res.status(400).json({
        success: false,
        message: `Cannot decline order in status '${order.orderStatus}'`,
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    order.deliveryBoyId = null;
    order.updateStatus(
      ORDER_STATUS.FOOD_READY,
      `Delivery assignment declined (${reason}). Reverted to food ready.`
    );
    await order.save();

    res.status(200).json({
      success: true,
      message: "Delivery assignment declined. Order returned to available pool.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const goToRestaurant = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.DELIVERY_ACCEPTED) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition to going to restaurant from status '${order.orderStatus}'. Must be '${ORDER_STATUS.DELIVERY_ACCEPTED}'`,
      });
    }

    order.updateStatus(
      ORDER_STATUS.GOING_TO_RESTAURANT,
      "Delivery partner is heading to the restaurant."
    );
    await order.save();

    res.status(200).json({
      success: true,
      flowStep: "go to restaurant",
      message: "Delivery partner is heading to the restaurant",
      data: order,
      
    });
  } catch (error) {
    next(error);
  }
};

export const takeFood = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.GOING_TO_RESTAURANT) {
      return res.status(400).json({
        success: false,
        message: `Cannot take food from restaurant in status '${order.orderStatus}'. Must be '${ORDER_STATUS.GOING_TO_RESTAURANT}'`,
      });
    }

    order.updateStatus(
      ORDER_STATUS.PICKED_UP,
      "Food successfully collected from the restaurant."
    );
    await order.save();

    await publishDeliveryEvent(KAFKA_EVENTS.FOOD_PICKED_UP, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryBoyId: req.user._id,
    });

    res.status(200).json({
      success: true,
      flowStep: "take food from",
      message: "Food picked up from restaurant",
      data: order,
    
    });
  } catch (error) {
    next(error);
  }
};

export const foodOutForDelivery = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.PICKED_UP) {
      return res.status(400).json({
        success: false,
        message: `Cannot set out for delivery in status '${order.orderStatus}'. Must be '${ORDER_STATUS.PICKED_UP}'`,
      });
    }

    order.updateStatus(
      ORDER_STATUS.OUT_FOR_DELIVERY,
      "Order is out for delivery to customer destination."
    );
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Out for Delivery!",
      message: "Your food is on the way to your delivery address.",
      type: "OUT_FOR_DELIVERY",
    });

    await publishDeliveryEvent(KAFKA_EVENTS.OUT_FOR_DELIVERY, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryBoyId: req.user._id,
      customerId: order.customerId,
    });

    res.status(200).json({
      success: true,
      flowStep: "food out from the delivery",
      message: "Order is now out for delivery",
      data: order,
     
    });
  } catch (error) {
    next(error);
  }
};

export const reachedCustomerLocation = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.OUT_FOR_DELIVERY) {
      return res.status(400).json({
        success: false,
        message: `Cannot reach customer location in status '${order.orderStatus}'. Must be '${ORDER_STATUS.OUT_FOR_DELIVERY}'`,
      });
    }

    order.updateStatus(
      ORDER_STATUS.REACHED_CUSTOMER_LOCATION,
      "Delivery partner arrived at the customer location."
    );
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Arrived at Location!",
      message: "Your delivery partner has arrived at your address.",
      type: "DELIVERY_ARRIVED",
    });

    await publishDeliveryEvent(KAFKA_EVENTS.REACHED_LOCATION, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryBoyId: req.user._id,
      customerId: order.customerId,
    });

    res.status(200).json({
      success: true,
      flowStep: "reached customer location",
      message: "Delivery partner has reached customer location",
      data: order,
      branches: {
        branchSuccess: {
          step: "handover",
          endpoint: "PUT /api/v1/delivery-service/order/:orderId/handover",
        },
        branchException: {
          step: "not reached to the location",
          endpoint: "PUT /api/v1/delivery-service/order/:orderId/not-reached",
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const reportDeliveryIssue = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason = "Customer unreachable / Incorrect address / Unable to find location" } =
      req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    if (
      order.orderStatus !== ORDER_STATUS.REACHED_CUSTOMER_LOCATION &&
      order.orderStatus !== ORDER_STATUS.OUT_FOR_DELIVERY
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot report delivery issue in status '${order.orderStatus}'`,
      });
    }

    order.updateStatus(
      ORDER_STATUS.DELIVERY_ISSUE,
      `Delivery issue reported: ${reason}. Escalating to customer support.`
    );
    await order.save();

    const ticket = await SupportTicket.create({
      ticketNumber: `TKT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      orderId: order._id,
      customerId: order.customerId,
      deliveryBoyId: order.deliveryBoyId,
      issueType: "NOT_REACHED_LOCATION",
      subject: `Order #${order.orderNumber} - Delivery Location Not Reachable`,
      description: reason,
      status: "OPEN",
    });

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Delivery Issue Escalated",
      message: `Delivery partner reported an issue: ${reason}. Customer Support Ticket #${ticket.ticketNumber} opened.`,
      type: "DELIVERY_ISSUE",
    });

    const supportUsers = await User.find({ role: "support", isActive: true });
    for (const sup of supportUsers) {
      await dispatchNotification({
        recipientId: sup._id,
        recipientRole: "support",
        orderId: order._id,
        title: "Urgent: Delivery Issue",
        message: `Delivery partner could not reach customer location for Order #${order.orderNumber}. Ticket #${ticket.ticketNumber} pending resolution.`,
        type: "DELIVERY_ISSUE",
      });
    }

    await publishDeliveryEvent(KAFKA_EVENTS.DELIVERY_ISSUE, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      ticketNumber: ticket.ticketNumber,
      reason,
    });

    res.status(200).json({
      success: true,
      flowStep: "not reached to the location -> customer support",
      message: "Delivery issue flagged and Customer Support ticket automatically opened",
      data: {
        order,
        supportTicket: ticket,
      }
    
    });
  } catch (error) {
    next(error);
  }
};

export const handover = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.REACHED_CUSTOMER_LOCATION) {
      return res.status(400).json({
        success: false,
        message: `Cannot handover food in status '${order.orderStatus}'. Must be '${ORDER_STATUS.REACHED_CUSTOMER_LOCATION}'`,
      });
    }

    order.updateStatus(ORDER_STATUS.HANDOVER, "Food handed over to customer.");
    await order.save();

    res.status(200).json({
      success: true,
      flowStep: "handover",
      message: "Food handed over to customer successfully",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const markOrderDelivered = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!verifyDeliveryPartner(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "You are not the assigned delivery partner for this order",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.HANDOVER) {
      return res.status(400).json({
        success: false,
        message: `Cannot mark delivered in status '${order.orderStatus}'. Must be '${ORDER_STATUS.HANDOVER}'`,
      });
    }

    order.updateStatus(
      ORDER_STATUS.DELIVERED,
      "Order delivered successfully to the customer."
    );
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Order Delivered!",
      message: "Your order was successfully delivered. Please rate your experience!",
      type: "ORDER_DELIVERED",
    });

    // Publish Kafka Order Delivered Event
    await publishDeliveryEvent(KAFKA_EVENTS.ORDER_DELIVERED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      deliveryBoyId: req.user._id,
      customerId: order.customerId,
    });

    res.status(200).json({
      success: true,
      flowStep: "order successfully deliverd",
      message: "Order marked as successfully delivered!",
      data: order
    });
  } catch (error) {
    next(error);
  }
};
