import express from "express";
import {
  getAvailableOrders,
  getMyDeliveries,
  assignDeliveryBoy,
  acceptDelivery,
  declineDelivery,
  goToRestaurant,
  takeFood,
  foodOutForDelivery,
  reachedCustomerLocation,
  reportDeliveryIssue,
  handover,
  markOrderDelivered,
} from "../controllers/deliveryServiceController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.use(protect);

router.get("/available-orders", authorize("delivery", "support"), getAvailableOrders);
router.get("/my-deliveries", authorize("delivery", "support"), getMyDeliveries);
router.put("/order/:orderId/assign", authorize("delivery", "support"), assignDeliveryBoy);
router.put("/order/:orderId/accept", authorize("delivery", "support"), acceptDelivery);
router.put("/order/:orderId/decline", authorize("delivery", "support"), declineDelivery);
router.put("/order/:orderId/go-to-restaurant", authorize("delivery", "support"), goToRestaurant);
router.put("/order/:orderId/take-food", authorize("delivery", "support"), takeFood);
router.put("/order/:orderId/out-for-delivery", authorize("delivery", "support"), foodOutForDelivery);
router.put("/order/:orderId/reached-location", authorize("delivery", "support"), reachedCustomerLocation);
router.put("/order/:orderId/not-reached", authorize("delivery", "support"), reportDeliveryIssue);
router.put("/order/:orderId/handover", authorize("delivery", "support"), handover);
router.put("/order/:orderId/deliver", authorize("delivery", "support"), markOrderDelivered);

export default router;
