import Order, { ORDER_STATUS } from "../../../models/Order.js";
import Restaurant from "../../../models/Restaurant.js";
import Notification from "../../../models/Notification.js";
import Payment from "../../../models/Payment.js";
import User from "../../../models/User.js";
import { dispatchNotification } from "../../../shared/utils/notificationDispatcher.js";
import { publishKitchenEvent } from "../kafka/producer.js";
import { KAFKA_EVENTS } from "../../../shared/constants/topics.js";

const getOwnedRestaurant = async (userId) => {
  return await Restaurant.findOne({ ownerId: userId });
};

export const getIncomingOrders = async (req, res, next) => {
  try {
    const { status, restaurantId } = req.query;
    let filter = {
      orderStatus: { $ne: ORDER_STATUS.PENDING_PAYMENT },
    };

    if (req.user.role === "support") {
      if (restaurantId) filter.restaurantId = restaurantId;
    } else {
      const restaurant = await getOwnedRestaurant(req.user._id);
      if (!restaurant) {
        return res.status(404).json({
          success: false,
          message: "No restaurant found associated with your account",
        });
      }
      filter.restaurantId = restaurant._id;
    }

    if (status) {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate("customerId", "name phone")
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

export const acceptOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const restaurant = await getOwnedRestaurant(req.user._id);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      restaurant &&
      order.restaurantId.toString() !== restaurant._id.toString() &&
      req.user.role !== "support"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this restaurant's orders",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be accepted in status '${order.orderStatus}'. Must be '${ORDER_STATUS.CONFIRMED}'`,
      });
    }

    order.updateStatus(ORDER_STATUS.ACCEPTED, "Restaurant accepted the order.");
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Order Accepted!",
      message: "The restaurant has accepted your order and will start preparing soon.",
      type: "ORDER_ACCEPTED",
    });

    // Publish Kafka Kitchen Event
    await publishKitchenEvent(KAFKA_EVENTS.ORDER_ACCEPTED, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
    });

    res.status(200).json({
      success: true,
      flowStep: "accept order -> if accepted",
      message: "Order successfully accepted by restaurant",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const rejectOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const { reason = "Restaurant kitchen at full capacity or ingredients unavailable" } = req.body;
    const restaurant = await getOwnedRestaurant(req.user._id);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      restaurant &&
      order.restaurantId.toString() !== restaurant._id.toString() &&
      req.user.role !== "support"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this restaurant's orders",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.CONFIRMED) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be rejected in status '${order.orderStatus}'. Must be '${ORDER_STATUS.CONFIRMED}'`,
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

    order.cancellationReason = `Declined by restaurant: ${reason}`;
    order.updateStatus(
      ORDER_STATUS.CANCELLED,
      `Order declined by restaurant: ${reason}.${
        refundProcessed ? ` Refund of ₹${order.totalAmount} initiated.` : ""
      }`
    );
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Order Declined by Restaurant",
      message: `The restaurant was unable to accept your order: ${reason}.`,
      type: "ORDER_CANCELLED",
    });

    res.status(200).json({
      success: true,
      flowStep: "restaurant rejected order",
      message: "Order declined by restaurant. Cancellation and refund processed.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const startPreparing = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const restaurant = await getOwnedRestaurant(req.user._id);
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      restaurant &&
      order.restaurantId.toString() !== restaurant._id.toString() &&
      req.user.role !== "support"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this restaurant's orders",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.ACCEPTED) {
      return res.status(400).json({
        success: false,
        message: `Order cannot start preparing. Current status: '${order.orderStatus}' (Must be '${ORDER_STATUS.ACCEPTED}')`,
      });
    }

    order.updateStatus(ORDER_STATUS.PREPARING, "Kitchen has started preparing the food.");
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Food Preparing",
      message: "Your delicious food is being freshly prepared in the kitchen.",
      type: "FOOD_PREPARING",
    });

    // Publish Kafka Kitchen Event
    await publishKitchenEvent(KAFKA_EVENTS.FOOD_PREPARING, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerId: order.customerId,
    });

    res.status(200).json({
      success: true,
      flowStep: "food preparing",
      message: "Food is now preparing",
      data: order
    });
  } catch (error) {
    next(error);
  }
};

export const markFoodReady = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const restaurant = await getOwnedRestaurant(req.user._id);
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      restaurant &&
      order.restaurantId.toString() !== restaurant._id.toString() &&
      req.user.role !== "support"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this restaurant's orders",
      });
    }

    if (order.orderStatus !== ORDER_STATUS.PREPARING) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be marked ready. Current status: '${order.orderStatus}' (Must be '${ORDER_STATUS.PREPARING}')`,
      });
    }

    order.updateStatus(
      ORDER_STATUS.FOOD_READY,
      "Food is prepared and ready for delivery partner pickup."
    );
    await order.save();

    await dispatchNotification({
      recipientId: order.customerId,
      recipientRole: "customer",
      orderId: order._id,
      title: "Food Ready!",
      message: "Your food is ready and packed for delivery pickup.",
      type: "FOOD_READY",
    });

   
    await publishKitchenEvent(KAFKA_EVENTS.FOOD_READY, {
      orderId: order._id,
      orderNumber: order.orderNumber,
      restaurantId: order.restaurantId,
      customerId: order.customerId,
    });

    res.status(200).json({
      success: true,
      flowStep: "food ready",
      message: "Food is marked ready for delivery pickup",
      data: order
    });
  } catch (error) {
    next(error);
  }
};
