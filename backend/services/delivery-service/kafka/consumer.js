import { createConsumer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";

export const initDeliveryKafkaConsumer = async () => {
  try {
    await createConsumer({
      serviceName: "Delivery-Service",
      groupId: "delivery-service-group",
      topics: [KAFKA_TOPICS.KITCHEN_EVENTS],
      messageHandler: async ({ topic, event }) => {
        if (event.eventType === KAFKA_EVENTS.FOOD_READY) {
          const order = event.data;
          console.log(
            `[Delivery-Service Kafka .`
          );
        }
      },
    });
  } catch (error) {
    console.warn("[Delivery-Service] Kafka consumer init skipped:", error.message);
  }
};
