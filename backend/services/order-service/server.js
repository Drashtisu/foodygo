import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "../../shared/config/db.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import orderRoutes from "./routes/orderRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import { initOrderKafkaConsumer } from "./kafka/consumer.js";

dotenv.config();

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 8003;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());


connectDB("Order-Service");


initOrderKafkaConsumer();


app.get("/health", (req, res) => {
  res.json({ service: "Order-Service", status: "UP", port: PORT });
});


app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/addresses", addressRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(` [Order-Service] running on port ${PORT}`);
});

export default app;
