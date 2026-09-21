import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "../../shared/config/db.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import deliveryServiceRoutes from "./routes/deliveryServiceRoutes.js";
import { initDeliveryKafkaConsumer } from "./kafka/consumer.js";

dotenv.config();

const app = express();
const PORT = process.env.DELIVERY_SERVICE_PORT || 8005;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB("Delivery-Service");

initDeliveryKafkaConsumer();

app.get("/health", (req, res) => {
  res.json({ service: "Delivery-Service", status: "UP", port: PORT });
});

app.use("/api/v1/delivery-service", deliveryServiceRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(` [Delivery-Service] running on port ${PORT}`);
});

export default app;
