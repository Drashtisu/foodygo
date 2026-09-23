import Notification from "../../models/Notification.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../constants/topics.js";



export const dispatchNotification = async ({
  recipientId,
  recipientRole = "customer",
  orderId = null,
  title,
  message,
  type = "ORDER_CONFIRMED",
  kafkaProducer = null,
}) => {
  if (!recipientId || !title || !message) {
    console.warn(" Missing required notification fields, ");
    return null;
  }

  let notification = null;

 
  const notifServicePort = process.env.NOTIFICATION_SERVICE_PORT || 8006;
  const notifServiceUrl =
    process.env.NOTIFICATION_SERVICE_URL || `http://localhost:${notifServicePort}`;

  try {
    const res = await fetch(`${notifServiceUrl}/api/v1/notifications/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret":
          process.env.JWT_SECRET || "foodygo_secret_jwt_key_2026_super_secure",
      },
      body: JSON.stringify({
        recipientId,
        recipientRole,
        orderId,
        title,
        message,
        type,
      }),
      signal: AbortSignal.timeout(3000), 
    });

    if (res.ok) {
      const data = await res.json();
      notification = data.data;
    }
  } catch (err) {
   
    try {
      notification = await Notification.create({
        recipientId,
        recipientRole,
        orderId: orderId || null,
        title,
        message,
        type,
      });
    } catch (dbErr) {
      console.error("[NotificationDispatcher] Direct DB fallback failed:", dbErr.message);
    }
  }


  if (kafkaProducer && typeof kafkaProducer.publishEvent === "function") {
    try {
      await kafkaProducer.publishEvent(
        KAFKA_TOPICS.NOTIFICATION_EVENTS,
        KAFKA_EVENTS.SEND_NOTIFICATION,
        {
          recipientId,
          recipientRole,
          orderId,
          title,
          message,
          type,
        }
      );
    } catch (kErr) {
      console.warn("[NotificationDispatcher] Kafka notification publish failed:", kErr.message);
    }
  }

  return notification;
};
