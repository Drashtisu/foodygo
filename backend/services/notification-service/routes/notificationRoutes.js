import express from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
} from "../controllers/notificationController.js";
import { protect } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/", getMyNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

export default router;
