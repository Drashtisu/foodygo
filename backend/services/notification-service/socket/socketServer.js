import { Server } from "socket.io";
import jwt from "jsonwebtoken";

  let io = null;

export const initSocketServer = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT"],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });


  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const bearerToken = authHeader?.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;

      const token =
        socket.handshake.auth?.token ||
        bearerToken ||
        socket.handshake.query?.token;

      if (!token) {
       
        return next(new Error("Authentication error: Token required"));
      }

      const secret =
        process.env.JWT_SECRET || "foodygo_secret_jwt_key_2026_super_secure";
      const decoded = jwt.verify(token, secret);
      socket.user = {
        _id: decoded.id || decoded._id,
        id: decoded.id || decoded._id,
        role: decoded.role || "customer",
        email: decoded.email,
      };

      next();
    } catch (err) {
     
      return next(new Error("Authentication error: Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.id || socket.user?._id;
    const role = socket.user?.role || "customer";

    console.log(`this user  id`);

    
    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (role) {
      socket.join(`role:${role}`);
    }

    socket.on("disconnect", (reason) => {
      console.log(`[Socket.io] Client disconnected: user=${userId} (${reason})`);
    });
  });

  console.log("[Notification-Service] Socket.io server initialized");
  return io;
};

export const getIO = () => io;


export const emitNotification = (notification) => {
  if (!io) {
    console.warn(" Socket.io server not initialized");
    return false;
  }

  const payload = notification.toObject ? notification.toObject() : notification;
  const recipientId = (payload.recipientId?._id || payload.recipientId)?.toString();

  if (recipientId) {
    io.to(`user:${recipientId}`).emit("notification", payload);
    console.log(`[Socket.io] Real-time notification emitted to "`);
    return true;
  } else if (payload.recipientRole) {
    io.to(`role:${payload.recipientRole}`).emit("notification", payload);
    console.log(`[Socket.io] Real-time notification broadcast to"`);
    return true;
  }

  return false;
};
