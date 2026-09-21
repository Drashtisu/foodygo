import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "../../shared/config/db.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 8004;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


connectDB("Payment-Service");


app.get("/health", (req, res) => {
  res.json({ service: "Payment-Service", status: "UP", port: PORT });
});


app.use("/api/v1/payment", paymentRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(` [Payment-Service] running on port ${PORT}`);
});

export default app;
