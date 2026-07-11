import express from "express";
import {
    createGroup,
    getMyGroups,
    joinGroup,
    addMember,
    removeMember,
    deleteGroup
} from "../controllers/group.controller.js";
import { getBalances } from "../controllers/balance.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createGroup);

router.get("/", protect, getMyGroups);

router.post("/join", protect, joinGroup);

router.post("/:groupId/add-member", protect, addMember);

router.delete("/:groupId/remove-member/:userId", protect, removeMember);

router.delete("/:groupId", protect, deleteGroup);

router.get("/:groupId/balance", protect, getBalances);

export default router;