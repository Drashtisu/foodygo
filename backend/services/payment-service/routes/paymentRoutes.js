import express from "express";
import {
  choosePaymentOption,
  processPayment,
  retryPayment,
  getInvoice,
} from "../controllers/paymentController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.use(protect);

router.post("/choose-option", authorize("customer"), choosePaymentOption);
router.post("/process", authorize("customer"), processPayment);
router.post("/retry", authorize("customer"), retryPayment);
router.get("/invoice/:orderId", getInvoice);

export default router;
