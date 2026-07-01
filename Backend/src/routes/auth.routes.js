import express from "express";
import { signup, login, getCurrentUser, logout} from "../controllers/auth.controller.js";
import { protect } from "../middleware/auth.middleware.js";
const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", protect, getCurrentUser);
router.post("/logout", logout);
export default router;