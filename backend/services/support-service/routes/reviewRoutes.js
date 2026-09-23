import express from "express";
import {
  submitReview,
  getReviewByOrder,
} from "../controllers/reviewController.js";
import { protect } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.post("/", protect, submitReview);
router.get("/order/:orderId", protect, getReviewByOrder);

export default router;
