import { createProducer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";

let producerInstance = null;

export const getRestaurantProducer = async () => {
  if (!producerInstance) {
    producerInstance = await createProducer("Restaurant-Service");
  }
  return producerInstance;
};

export const publishKitchenEvent = async (eventType, payload) => {
  try {
    const p = await getRestaurantProducer();
    if (p) {
      await p.publishEvent(KAFKA_TOPICS.KITCHEN_EVENTS, eventType, payload, payload.orderId || payload._id);
    }
  } catch (err) {
    console.warn("[Restaurant-Service] Could not publish kitchen event:", err.message);
  }
};
