import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT =  process.env.PORT || 8000;

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());


const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || `http://localhost:${process.env.AUTH_SERVICE_PORT || 8001}`,
  restaurant: process.env.RESTAURANT_SERVICE_URL || `http://localhost:${process.env.RESTAURANT_SERVICE_PORT || 8002}`,
  order: process.env.ORDER_SERVICE_URL || `http://localhost:${process.env.ORDER_SERVICE_PORT || 8003}`,
  payment: process.env.PAYMENT_SERVICE_URL || `http://localhost:${process.env.PAYMENT_SERVICE_PORT || 8004}`,
  delivery: process.env.DELIVERY_SERVICE_URL || `http://localhost:${process.env.DELIVERY_SERVICE_PORT || 8005}`,
  notification: process.env.NOTIFICATION_SERVICE_URL || `http://localhost:${process.env.NOTIFICATION_SERVICE_PORT || 8006}`,
  support: process.env.SUPPORT_SERVICE_URL || `http://localhost:${process.env.SUPPORT_SERVICE_PORT || 8007}`,
};

const createServiceProxy = (target) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    ws: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
      proxyReq: fixRequestBody,
      error: (err, req, res) => {
        console.error(`[Gateway Error] Target ${target} unreachable:`, err.message);
        if (!res.headersSent) {
          res.status(503).json({
            success: false,
            message: `Service at ${target} is currently unavailable`,
            error: err.message,
          });
        }
      },
    },
  });
};


app.get("/", (req, res) => {
  res.json({
    message: "Welcome to FoodyGo API ",
    architecture: "Event-Driven Microservices with Apache Kafka",
    status: "active",
    gatewayPort: PORT,
    services: SERVICES,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "UP", timestamp: new Date().toISOString() });
});


app.use("/api/v1/auth", createServiceProxy(SERVICES.auth));
app.use("/api/v1/restaurants", createServiceProxy(SERVICES.restaurant));
app.use("/api/v1/menu", createServiceProxy(SERVICES.restaurant));
app.use("/api/v1/restaurant-service", createServiceProxy(SERVICES.restaurant));
app.use("/api/v1/orders", createServiceProxy(SERVICES.order));
app.use("/api/v1/cart", createServiceProxy(SERVICES.order));
app.use("/api/v1/addresses", createServiceProxy(SERVICES.order));
app.use("/api/v1/payment", createServiceProxy(SERVICES.payment));
app.use("/api/v1/delivery-service", createServiceProxy(SERVICES.delivery));
app.use("/api/v1/notifications", createServiceProxy(SERVICES.notification));
app.use("/api/v1/reviews", createServiceProxy(SERVICES.support));
app.use("/api/v1/support", createServiceProxy(SERVICES.support));


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Gateway route not found`,
  });
});

app.listen(PORT, () => {
 
  console.log(`[API Gateway] running on port ${PORT}`);
 
  
});

export default app;
