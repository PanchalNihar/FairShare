import express from "express";
import {
    createExpense,
    getGroupExpenses
} from "../controllers/expense.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createExpense);

router.get("/:groupId", protect, getGroupExpenses);


export default router;