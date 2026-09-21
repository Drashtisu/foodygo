import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "../../shared/config/db.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { initNotificationKafkaConsumer } from "./kafka/consumer.js";

dotenv.config();

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 8006;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


connectDB("Notification-Service");


initNotificationKafkaConsumer();


app.get("/health", (req, res) => {
  res.json({ service: "Notification-Service", status: "UP", port: PORT });
});


app.use("/api/v1/notifications", notificationRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(` [Notification-Service] running on port ${PORT}`);
});

export default app;
