import { createProducer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";

let producerInstance = null;

export const getOrderProducer = async () => {
  if (!producerInstance) {
    producerInstance = await createProducer("Order-Service");
  }
  return producerInstance;
};

export const publishOrderEvent = async (eventType, payload) => {
  try {
    const p = await getOrderProducer();
    if (p) {
      await p.publishEvent(KAFKA_TOPICS.ORDER_EVENTS, eventType, payload, payload._id || payload.orderId);
    }
  } catch (err) {
    console.warn("[Order-Service] Could not publish order event:", err.message);
  }
};
