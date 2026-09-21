import express from "express";
import {
  addAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import { protect, authorize } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.use(protect);
router.use(authorize("customer"));

router.post("/", addAddress);
router.get("/", getUserAddresses);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
