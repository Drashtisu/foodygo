import express from "express";
import {
  choosePaymentOption,
  processPayment,
  retryPayment,
  getInvoice,
} from "../controllers/paymentController.js";
import { protect } from "../../../shared/middleware/auth.js";

const router = express.Router();

// Allow any authenticated user to process payment for their order
router.use(protect);

router.post("/choose-option", choosePaymentOption);
router.post("/process", processPayment);
router.post("/retry", retryPayment);
router.get("/invoice/:orderId", getInvoice);

export default router;
