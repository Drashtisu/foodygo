import express from "express";
import {
  getMyNotifications,
  markAsRead,
  markAllAsRead,
  sendNotificationHandler,
} from "../controllers/notificationController.js";
import { protect } from "../../../shared/middleware/auth.js";

const router = express.Router();


const allowInternalOrProtect = (req, res, next) => {
  const internalSecret = req.headers["x-internal-secret"];
  const expectedSecret =
    process.env.JWT_SECRET || "foodygo_secret_jwt_key_2026_super_secure";

  if (internalSecret && internalSecret === expectedSecret) {
    req.user = { id: "system", role: "system" };
    return next();
  }
  return protect(req, res, next);
};


router.post("/send", allowInternalOrProtect, sendNotificationHandler);


router.use(protect);
router.get("/", getMyNotifications);
router.put("/:id/read", markAsRead);
router.put("/read-all", markAllAsRead);

export default router;
