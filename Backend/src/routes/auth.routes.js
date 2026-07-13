import express from "express";
import { signup, login, getCurrentUser, logout, searchUsers, updateProfile, googleLogin } from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", protect, getCurrentUser);
router.get("/search", protect, searchUsers);
router.post("/logout", logout);
router.put("/profile", protect, updateProfile);

export default router;