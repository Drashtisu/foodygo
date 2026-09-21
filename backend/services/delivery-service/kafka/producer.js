import { createProducer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";

let producerInstance = null;

export const getDeliveryProducer = async () => {
  if (!producerInstance) {
    producerInstance = await createProducer("Delivery-Service");
  }
  return producerInstance;
};

export const publishDeliveryEvent = async (eventType, payload) => {
  try {
    const p = await getDeliveryProducer();
    if (p) {
      await p.publishEvent(
        KAFKA_TOPICS.DELIVERY_EVENTS,
        eventType,
        payload,
        payload.orderId || payload._id
      );
    }
  } catch (err) {
    console.warn("[Delivery-Service] Could not publish delivery event:", err.message);
  }
};
