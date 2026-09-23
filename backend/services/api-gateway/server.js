import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

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
    ws: false,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
      proxyReq: (proxyReq, req) => {
        if (req.body && Object.keys(req.body).length > 0) {
          try {
            fixRequestBody(proxyReq, req);
          } catch (e) {
            // ignore body fix error if body is already piped
          }
        }
      },
      error: (err, req, res) => {
        console.error(`[Gateway Error] Target ${target} unreachable:`, err.message);
        if (res && typeof res.status === "function" && !res.headersSent) {
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
    message: "Welcome to FoodyGo API",
    architecture: "Event-Driven Microservices with Apache Kafka & Socket.io",
    status: "active",
    gatewayPort: PORT,
    services: SERVICES,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "UP", timestamp: new Date().toISOString() });
});

// Dedicated proxy for Socket.io traffic to Notification-Service
const socketProxy = createProxyMiddleware({
  target: SERVICES.notification,
  changeOrigin: true,
  ws: true,
  on: {
    error: (err, req, res) => {
      console.error("[Gateway Socket Proxy Error]:", err.message);
      if (res && typeof res.writeHead === "function" && !res.headersSent) {
        res.writeHead(502);
        res.end();
      }
    },
  },
});
app.use("/socket.io", socketProxy);

// Microservices routing
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
    message: "Gateway route not found",
  });
});

// Prevent unhandled proxy errors from crashing the Gateway process
process.on("uncaughtException", (err) => {
  console.error("[Gateway UncaughtException]:", err.message);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Gateway UnhandledRejection]:", reason);
});

const server = http.createServer(app);

// Forward WebSocket HTTP upgrade requests to socketProxy
server.on("upgrade", (req, socket, head) => {
  if (req.url && req.url.startsWith("/socket.io")) {
    socketProxy.upgrade(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[API Gateway] running on port ${PORT} (HTTP & WebSocket proxy enabled)`);
});

export { app, server };
export default app;
