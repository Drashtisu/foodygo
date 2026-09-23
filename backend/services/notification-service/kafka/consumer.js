import { createConsumer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";
import Notification from "../../../models/Notification.js";
import { emitNotification } from "../socket/socketServer.js";

const buildNotificationFromEvent = (eventType, data) => {
  switch (eventType) {
    case KAFKA_EVENTS.SEND_NOTIFICATION:
      return {
        recipientId: data.recipientId,
        recipientRole: data.recipientRole || "customer",
        orderId: data.orderId || null,
        title: data.title,
        message: data.message,
        type: data.type || "SYSTEM",
      };

    case KAFKA_EVENTS.ORDER_ACCEPTED:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Order Accepted!",
        message: `The restaurant has accepted your order #${data.orderNumber || ""}.`,
        type: "ORDER_ACCEPTED",
      };

    case KAFKA_EVENTS.FOOD_PREPARING:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Food is Preparing",
        message: `Your food for order #${data.orderNumber || ""} is currently being prepared.`,
        type: "FOOD_PREPARING",
      };

    case KAFKA_EVENTS.FOOD_READY:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Food Ready for Pickup",
        message: `Order #${data.orderNumber || ""} is prepared and packed!`,
        type: "FOOD_READY",
      };

    case KAFKA_EVENTS.DELIVERY_ASSIGNED:
      return {
        recipientId: data.deliveryBoyId,
        recipientRole: "delivery",
        orderId: data.orderId,
        title: "New Delivery Assigned!",
        message: `Order #${data.orderNumber || ""} has been assigned to you.`,
        type: "DELIVERY_ASSIGNED",
      };

    case KAFKA_EVENTS.DELIVERY_ACCEPTED:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Delivery Partner Assigned",
        message: `A delivery partner accepted your order #${data.orderNumber || ""} and is en route.`,
        type: "DELIVERY_ASSIGNED",
      };

    case KAFKA_EVENTS.FOOD_PICKED_UP:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Food Picked Up",
        message: `Your order #${data.orderNumber || ""} has been picked up from the restaurant.`,
        type: "OUT_FOR_DELIVERY",
      };

    case KAFKA_EVENTS.OUT_FOR_DELIVERY:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Out for Delivery!",
        message: `Order #${data.orderNumber || ""} is on its way to your delivery address!`,
        type: "OUT_FOR_DELIVERY",
      };

    case KAFKA_EVENTS.REACHED_LOCATION:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Delivery Partner Arrived",
        message: `Your delivery partner has arrived at your location for order #${data.orderNumber || ""}.`,
        type: "DELIVERY_ARRIVED",
      };

    case KAFKA_EVENTS.ORDER_DELIVERED:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Order Delivered!",
        message: `Order #${data.orderNumber || ""} was delivered successfully! Enjoy your meal.`,
        type: "ORDER_DELIVERED",
      };

    case KAFKA_EVENTS.DELIVERY_ISSUE:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Delivery Issue Reported",
        message: `There was an issue reported for order #${data.orderNumber || ""}. Support is looking into it.`,
        type: "DELIVERY_ISSUE",
      };

    case KAFKA_EVENTS.PAYMENT_SUCCESS:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Payment Confirmed",
        message: `Payment for order #${data.orderNumber || ""} was received successfully.`,
        type: "ORDER_CONFIRMED",
      };

    case KAFKA_EVENTS.PAYMENT_FAILED:
      return {
        recipientId: data.customerId,
        recipientRole: "customer",
        orderId: data.orderId,
        title: "Payment Failed",
        message: `Payment failed for order #${data.orderNumber || ""}. Please retry.`,
        type: "ORDER_CANCELLED",
      };

    default:
      return null;
  }
};

export const initNotificationKafkaConsumer = async () => {
  try {
    await createConsumer({
      serviceName: "Notification-Service",
      groupId: "notification-service-group",
      topics: [
        KAFKA_TOPICS.NOTIFICATION_EVENTS,
        KAFKA_TOPICS.ORDER_EVENTS,
        KAFKA_TOPICS.PAYMENT_EVENTS,
        KAFKA_TOPICS.KITCHEN_EVENTS,
        KAFKA_TOPICS.DELIVERY_EVENTS,
      ],
      messageHandler: async ({ topic, event }) => {
        const { eventType, data } = event;
        if (!data) return;

        const notifData = buildNotificationFromEvent(eventType, data);
        if (!notifData || !notifData.recipientId) return;

        try {
          // Check for duplicate recent notification 
          const recentThreshold = new Date(Date.now() - 30 * 1000);
          let notification = null;

          if (notifData.orderId) {
            notification = await Notification.findOne({
              recipientId: notifData.recipientId,
              orderId: notifData.orderId,
              type: notifData.type,
              createdAt: { $gte: recentThreshold },
            });
          }

          if (!notification) {
            notification = await Notification.create(notifData);
          }

          if (notification.orderId) {
            await notification.populate("orderId", "orderNumber orderStatus totalAmount");
          }

          // Push real-time notification to the user via Socket.io
          emitNotification(notification);
        } catch (err) {
          console.error(
            `[Notification-Service] Failed to process notification for ${eventType}:`,
            err.message
          );
        }
      },
    });
  } catch (error) {
    console.warn("[Notification-Service] Kafka consumer init skipped:", error.message);
  }
};
