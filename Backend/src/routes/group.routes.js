import express from "express";
import {
    createGroup,
    getMyGroups,
    joinGroup
} from "../controllers/group.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createGroup);

router.get("/", protect, getMyGroups);

router.post("/join", protect, joinGroup);
export default router;