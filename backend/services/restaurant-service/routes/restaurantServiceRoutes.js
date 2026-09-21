import express from "express";
import {
  getIncomingOrders,
  acceptOrder,
  startPreparing,
  markFoodReady,
} from "../controllers/restaurantServiceController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("restaurant", "support"));

router.get("/orders", getIncomingOrders);
router.put("/order/:orderId/accept", acceptOrder);
router.put("/order/:orderId/preparing", startPreparing);
router.put("/order/:orderId/ready", markFoodReady);

export default router;
