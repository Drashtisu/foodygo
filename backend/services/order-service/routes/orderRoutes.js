import express from "express";
import {
  getOrderDetails,
  trackOrder,
  getCustomerOrders,
  getAllOrders,
} from "../controllers/orderController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/my-orders", authorize("customer"), getCustomerOrders);
router.get("/", authorize("support"), getAllOrders);
router.get("/:id/track", trackOrder);
router.get("/:id", getOrderDetails);

export default router;
