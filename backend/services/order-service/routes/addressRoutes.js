import express from "express";
import {
  addAddress,
  getUserAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/addressController.js";
import { protect } from "../../../shared/middleware/auth.js";

const router = express.Router();

// Allow any authenticated user to manage their delivery addresses
router.use(protect);

router.post("/", addAddress);
router.get("/", getUserAddresses);
router.put("/:id", updateAddress);
router.delete("/:id", deleteAddress);

export default router;
