import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("customer"));

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/item", updateCartItem);
router.delete("/item/:menuItemId", removeFromCart);
router.delete("/clear", clearCart);

export default router;
