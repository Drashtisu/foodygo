import express from "express";
import {
  submitReview,
  getReviewByOrder,
} from "../controllers/reviewController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.post("/", protect, authorize("customer"), submitReview);
router.get("/order/:orderId", protect, getReviewByOrder);



export default router;
