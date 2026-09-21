import express from "express";
import {
  searchRestaurants,
  getAllRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
} from "../controllers/restaurantController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.get("/search", searchRestaurants);
router.get("/", getAllRestaurants);
router.get("/:id", getRestaurantById);

router.post("/", protect, authorize("restaurant", "support"), createRestaurant);
router.put("/:id", protect, authorize("restaurant", "support"), updateRestaurant);

export default router;
