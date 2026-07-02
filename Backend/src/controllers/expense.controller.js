import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import jwt from "jsonwebtoken";
/**
 * Create Expense
 */
export const createExpense = async (req, res) => {
    try {

        const {
            groupId,
            amount,
            description,
            category,
            expenseDate
        } = req.body;

        if (!groupId || !amount || !description) {
            return res.status(400).json({
                success: false,
                message: "Group, amount and description are required."
            });
        }

        // Check if group exists
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        // Check if logged-in user is a member
        const isMember = group.members.some(
            member => member.user.toString() === req.user.id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "You are not a member of this group."
            });
        }

        // Create expense
        const expense = await Expense.create({

            group: groupId,

            paidBy: req.user.id,

            amount,

            description,

            category: category || "Other",

            expenseDate: expenseDate || Date.now()

        });

        res.status(201).json({
            success: true,
            message: "Expense added successfully.",
            data: expense
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

/**
 * Get Expenses of a Group
 */
export const getGroupExpenses = async (req, res) => {

    try {

        const { groupId } = req.params;

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        const isMember = group.members.some(
            member => member.user.toString() === req.user.id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        const expenses = await Expense.find({
            group: groupId
        })
        .populate("paidBy", "username email avatar")
        .sort({ expenseDate: -1 });

        res.status(200).json({
            success: true,
            data: expenses
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};