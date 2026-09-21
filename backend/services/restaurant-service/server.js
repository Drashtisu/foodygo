import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "../../shared/config/db.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import restaurantServiceRoutes from "./routes/restaurantServiceRoutes.js";
import { initRestaurantKafkaConsumer } from "./kafka/consumer.js";

dotenv.config();

const app = express();
const PORT = process.env.RESTAURANT_SERVICE_PORT || 8002;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

connectDB("Restaurant-Service");

initRestaurantKafkaConsumer();

app.get("/health", (req, res) => {
  res.json({ service: "Restaurant-Service", status: "UP", port: PORT });
});

app.use("/api/v1/restaurants", restaurantRoutes);
app.use("/api/v1/menu", menuRoutes);
app.use("/api/v1/restaurant-service", restaurantServiceRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(` [Restaurant-Service] running on port ${PORT}`);
});

export default app;
