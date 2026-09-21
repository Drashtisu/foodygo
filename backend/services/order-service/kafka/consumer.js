import { createConsumer } from "../../../shared/config/kafka.js";
import { KAFKA_TOPICS, KAFKA_EVENTS } from "../../../shared/constants/topics.js";
import Order, { ORDER_STATUS } from "../../../models/Order.js";

export const initOrderKafkaConsumer = async () => {
  try {
    await createConsumer({
      serviceName: "Order-Service",
      groupId: "order-service-group",
      topics: [
        KAFKA_TOPICS.PAYMENT_EVENTS,
        KAFKA_TOPICS.KITCHEN_EVENTS,
        KAFKA_TOPICS.DELIVERY_EVENTS,
      ],
      messageHandler: async ({ topic, event }) => {
        const { eventType, data } = event;
        const orderId = data.orderId || data._id;

        if (!orderId) return;

        try {
          const order = await Order.findById(orderId);
          if (!order) return;

          switch (eventType) {
            case KAFKA_EVENTS.PAYMENT_SUCCESS:
              if (order.orderStatus === ORDER_STATUS.PENDING_PAYMENT) {
                order.paymentStatus = "PAID";
                order.updateStatus(ORDER_STATUS.CONFIRMED, "Payment verified via Kafka event.");
                await order.save();
                console.log(` Order-Service`);
              }
              break;

            case KAFKA_EVENTS.ORDER_ACCEPTED:
              if (order.orderStatus !== ORDER_STATUS.ACCEPTED) {
                order.updateStatus(ORDER_STATUS.ACCEPTED, "Restaurant accepted the order.");
                await order.save();
              }
              break;

            case KAFKA_EVENTS.FOOD_READY:
              if (order.orderStatus !== ORDER_STATUS.FOOD_READY) {
                order.updateStatus(ORDER_STATUS.FOOD_READY, "Food prepared and ready for delivery.");
                await order.save();
              }
              break;

            case KAFKA_EVENTS.DELIVERY_ASSIGNED:
              if (data.deliveryBoyId) {
                order.deliveryBoyId = data.deliveryBoyId;
              }
              order.updateStatus(ORDER_STATUS.DELIVERY_ASSIGNED, "Delivery partner assigned.");
              await order.save();
              break;

            case KAFKA_EVENTS.ORDER_DELIVERED:
              order.updateStatus(ORDER_STATUS.DELIVERED, "Order delivered to customer.");
              order.deliveryConfirmedAt = new Date();
              await order.save();
              console.log(`🎉 [Order-Service] Order #${order.orderNumber} successfully delivered!`);
              break;

            default:
              break;
          }
        } catch (err) {
          console.error(`[Order-Service] Error updating order ${orderId} on event ${eventType}:`, err.message);
        }
      },
    });
  } catch (error) {
    console.warn("[Order-Service] Kafka consumer init skipped:", error.message);
  }
};
