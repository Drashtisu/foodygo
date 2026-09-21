import { createConsumer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";

export const initRestaurantKafkaConsumer = async () => {
  try {
    await createConsumer({
      serviceName: "Restaurant-Service",
      groupId: "restaurant-service-group",
      topics: [KAFKA_TOPICS.PAYMENT_EVENTS],
      messageHandler: async ({ topic, event }) => {
        if (event.eventType === KAFKA_EVENTS.PAYMENT_SUCCESS) {
          const order = event.data;
          console.log(
            ` Restaurant-Service `
          );
        }
      },
    });
  } catch (error) {
    console.warn("[Restaurant-Service] Kafka consumer init skipped:", error.message);
  }
};
