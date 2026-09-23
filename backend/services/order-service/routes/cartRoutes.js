import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../../../shared/middleware/auth.js";

const router = express.Router();

// Allow any authenticated user to manage their cart
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.put("/item", updateCartItem);
router.delete("/item/:menuItemId", removeFromCart);
router.delete("/clear", clearCart);

export default router;
