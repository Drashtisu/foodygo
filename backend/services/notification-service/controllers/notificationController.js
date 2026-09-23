import Notification from "../../../models/Notification.js";
import { emitNotification } from "../socket/socketServer.js";

export const getMyNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.user._id,
    })
      .populate("orderId", "orderNumber orderStatus totalAmount")
      .sort({ createdAt: -1 });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    if (notification.recipientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized for this notification",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipientId: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};


export const sendNotificationHandler = async (req, res, next) => {
  try {
    const { recipientId, recipientRole, orderId, title, message, type } = req.body;

    if (!recipientId || !title || !message) {
      return res.status(400).json({
        success: false,
        message: "recipientId, title, and message are required fields",
      });
    }

    const notification = await Notification.create({
      recipientId,
      recipientRole: recipientRole || "customer",
      orderId: orderId || null,
      title,
      message,
      type: type || "ORDER_CONFIRMED",
    });

    // Populate orderId if present for client rich display
    if (orderId) {
      await notification.populate("orderId", "orderNumber orderStatus totalAmount");
    }

    // Real-time push via Socket.io
    emitNotification(notification);

    res.status(201).json({
      success: true,
      message: "Notification created and emitted in real-time",
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};
