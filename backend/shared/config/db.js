import mongoose from "mongoose";
import "../../models/User.js";
import "../../models/Restaurant.js";
import "../../models/MenuItem.js";
import "../../models/Order.js";
import "../../models/Cart.js";
import "../../models/Address.js";
import "../../models/Payment.js";
import "../../models/Invoice.js";
import "../../models/Review.js";
import "../../models/SupportTicket.js";
import "../../models/Notification.js";

const connectDB = async (serviceName = "Service") => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    if (mongoose.connection.readyState >= 1) {
      console.log(`[${serviceName}] MongoDB already connected`);
      return mongoose.connection;
    }

    const conn = await mongoose.connect(mongoUri);
    console.log(`[${serviceName}] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[${serviceName}] Error connecting to MongoDB:`, error.message);
    process.exit(1);
  }
};

export default connectDB;
