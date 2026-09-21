import express from "express";
import {
  register,
  login,
  getProfile,
  updateProfile,
  logout,
} from "../controllers/authController.js";
import { protect } from "../../../shared/middleware/auth.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
