import express from "express";
import {
  getMenuByRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menuController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.get("/restaurant/:restaurantId", getMenuByRestaurant);

router.post("/", protect, authorize("restaurant", "support"), addMenuItem);
router.put("/:id", protect, authorize("restaurant", "support"), updateMenuItem);
router.delete("/:id", protect, authorize("restaurant", "support"), deleteMenuItem);

export default router;
