import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import connectDB from "../../shared/config/db.js";
import { errorHandler } from "../../shared/middleware/errorHandler.js";

import reviewRoutes from "./routes/reviewRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.SUPPORT_SERVICE_PORT || 8007;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());




connectDB("Support-Service");


app.get("/health", (req, res) => {
  res.json({ service: "Support-Service", status: "UP", port: PORT });
});


// app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/reviews", reviewRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(` [Support-Service] running on port ${PORT}`);
});

export default app;
