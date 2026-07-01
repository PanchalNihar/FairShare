import express from "express";
import {
    createGroup,
    getMyGroups
} from "../controllers/group.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createGroup);

router.get("/", protect, getMyGroups);

export default router;