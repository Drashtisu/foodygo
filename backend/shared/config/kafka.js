import { Kafka, logLevel } from "kafkajs";

process.env.KAFKAJS_NO_PARTITIONER_WARNING = "1";

const brokers = (process.env.KAFKA_BROKERS || "localhost:9092").split(",");
console.log(process);
export const getKafkaClient = (serviceName = "foodfloods-service") => {
  return new Kafka({
    clientId: `${process.env.KAFKA_CLIENT_ID || "foodfloods"}-${serviceName}`,
    brokers: brokers,
    logLevel: logLevel.WARN,
    retry: {
      initialRetryTime: 300,
      retries: 5,
    },
  });
};

 
export const createProducer = async (serviceName = "service") => {
  const kafka = getKafkaClient(serviceName);
  const producer = kafka.producer();
  let isConnected = false;

  try {
    await producer.connect();
    isConnected = true;
    console.log(`[${serviceName}] Kafka Producer connected to brokers: ${brokers.join(", ")}`);
  } catch (error) {
    console.warn(
      `[${serviceName}] Kafka Producer could not connect to ${brokers.join(", ")}. Run 'npm run docker:kafka:up' to start Kafka in Docker. (${error.message})`
    );
  }

  const publishEvent = async (topic, eventType, payload, key = null) => {
    const messageValue = JSON.stringify({
      eventType,
      sourceService: serviceName,
      timestamp: new Date().toISOString(),
      data: payload,
    });

    if (!isConnected) {
    
      try {
        await producer.connect();
        isConnected = true;
      } catch (err) {
        console.warn(`[${serviceName}] [Kafka] Offline: Skipped publishing ${eventType} to topic '${topic}'`);
        return null;
      }
    }

    try {
      const result = await producer.send({
        topic,
        messages: [
          {
            key: key ? String(key) : String(payload.id || payload._id || eventType),
            value: messageValue,
          },
        ],
      });
      console.log(`[${serviceName}] Event published [${eventType}] -> Topic: ${topic}`);
      return result;
    } catch (error) {
      console.error(`[${serviceName}] Failed to publish event [${eventType}]:`, error.message);
      return null;
    }
  };

  return {
    producer,
    publishEvent,
    disconnect: () => producer.disconnect(),
  };
};


export const createConsumer = async ({
  serviceName = "service",
  groupId,
  topics = [],
  messageHandler,
}) => {
  const kafka = getKafkaClient(serviceName);
  const consumer = kafka.consumer({ groupId: groupId || `${serviceName}-group` });

  try {
    await consumer.connect();
    console.log(`[${serviceName}] Kafka Consumer connected to group: ${groupId || `${serviceName}-group`}`);

    for (const topic of topics) {
      await consumer.subscribe({ topic, fromBeginning: false });
      console.log(`[${serviceName}] Subscribed to topic: ${topic}`);
    }

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawValue = message.value ? message.value.toString() : "{}";
          const parsed = JSON.parse(rawValue);
          console.log(
            `[${serviceName}] Received event [${parsed.eventType || "UNKNOWN"}] from topic '${topic}'`
          );
          if (messageHandler) {
            await messageHandler({
              topic,
              partition,
              key: message.key ? message.key.toString() : null,
              event: parsed,
            });
          }
        } catch (err) {
          console.error(`[${serviceName}] Error handling message on topic '${topic}':`, err.message);
        }
      },
    });

    return consumer;
  } catch (error) {
    console.warn(
      `[${serviceName}] Kafka Consumer could not connect to ${brokers.join(", ")}. Run 'npm run docker:kafka:up' to start Kafka. (${error.message})`
    );
    return null;
  }
};
