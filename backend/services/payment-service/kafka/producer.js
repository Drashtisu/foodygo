import { createProducer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";

let producerInstance = null;

export const getPaymentProducer = async () => {
  if (!producerInstance) {
    producerInstance = await createProducer("Payment-Service");
  }
  return producerInstance;
};

export const publishPaymentEvent = async (eventType, payload) => {
  try {
    const p = await getPaymentProducer();
    if (p) {
      await p.publishEvent(
        KAFKA_TOPICS.PAYMENT_EVENTS,
        eventType,
        payload,
        payload.orderId || payload._id
      );
    }
  } catch (err) {
    console.warn("[Payment-Service] Could not publish payment event:", err.message);
  }
};
