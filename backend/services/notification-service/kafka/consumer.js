import { createConsumer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";
import Notification from "../../../models/Notification.js";

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

        try {
          if (eventType === KAFKA_EVENTS.SEND_NOTIFICATION && data.recipientId) {
            await Notification.create({
              recipientId: data.recipientId,
              recipientRole: data.recipientRole || "customer",
              orderId: data.orderId || null,
              title: data.title,
              message: data.message,
              type: data.type || "SYSTEM",
            });
            console.log(` [Notification-Service `);
          } else if (eventType === KAFKA_EVENTS.ORDER_DELIVERED && data.customerId) {
            await Notification.create({
              recipientId: data.customerId,
              recipientRole: "customer",
              orderId: data.orderId,
              title: "Order Delivered!",
              message: `Order #${data.orderNumber} was delivered successfully!`,
              type: "ORDER_DELIVERED",
            });
          }
        } catch (err) {
          console.error("[Notification-Service] Failed to save notification from Kafka event:", err.message);
        }
      },
    });
  } catch (error) {
    console.warn("[Notification-Service] Kafka consumer init skipped:", error.message);
  }
};
