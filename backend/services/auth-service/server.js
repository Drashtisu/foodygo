import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "../../shared/config/db.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 8001;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


connectDB("Auth-Service");


app.get("/health", (req, res) => {
  res.json({ service: "Auth-Service", status: "UP", port: PORT });
});


app.use("/api/v1/auth", authRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Auth-Service running on port ${PORT}`);
});

export default app;
