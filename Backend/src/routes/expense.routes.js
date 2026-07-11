import express from "express";
import {
    createExpense,
    getGroupExpenses,
    updateExpense,
    deleteExpense
} from "../controllers/expense.controller.js";

import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", protect, createExpense);

router.get("/:groupId", protect, getGroupExpenses);

router.put("/:expenseId", protect, updateExpense);

router.delete("/:expenseId", protect, deleteExpense);

export default router;