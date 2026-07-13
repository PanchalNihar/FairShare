import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import jwt from "jsonwebtoken";
import { scanReceipt } from "../services/gemini.service.js";
import User from "../models/User.js";

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
            expenseDate,
            paidBy
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

        const payeeId = paidBy || req.user.id;

        const isPayeeMember = group.members.some(
            member => (member.user ? member.user.toString() : member._id.toString()) === payeeId.toString()
        );

        if (!isPayeeMember) {
            return res.status(400).json({
                success: false,
                message: "The payee must be a member of this group."
            });
        }

        // Create expense
        const expense = await Expense.create({

            group: groupId,

            paidBy: payeeId,

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
        .sort({ expenseDate: -1 })
        .lean();

        // Get group guest members to construct virtual user profiles
        const guestMemberIds = group.members
            .filter(m => !m.user)
            .map(m => m._id.toString());

        // Find registered user IDs to populate
        const registeredUserIds = expenses
            .map(e => e.paidBy ? e.paidBy.toString() : null)
            .filter(id => id && !guestMemberIds.includes(id));

        // Fetch registered user details
        const users = await User.find({ _id: { $in: registeredUserIds } }, "username email avatar").lean();
        const userMap = {};
        users.forEach(u => {
            userMap[u._id.toString()] = u;
        });

        // Construct populated expenses
        const populatedExpenses = expenses.map(expense => {
            if (expense.paidBy) {
                const payerIdStr = expense.paidBy.toString();
                if (guestMemberIds.includes(payerIdStr)) {
                    const guestMember = group.members.find(m => m._id.toString() === payerIdStr);
                    expense.paidBy = {
                        _id: guestMember._id,
                        username: guestMember.username,
                        email: guestMember.email || "temp@fairshare.fake",
                        avatar: ""
                    };
                } else {
                    expense.paidBy = userMap[payerIdStr] || {
                        _id: expense.paidBy,
                        username: "Unknown User",
                        email: ""
                    };
                }
            }
            return expense;
        });

        res.status(200).json({
            success: true,
            data: populatedExpenses
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

export const updateExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;
        const { amount, description, category, paidBy } = req.body;

        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found."
            });
        }

        const group = await Group.findById(expense.group);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        // Check if logged-in user is a member of the group
        const isMember = group.members.some(
            member => member.user.toString() === req.user.id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        // If payee is being updated, verify payee is a member
        if (paidBy) {
            const isPayeeMember = group.members.some(
                member => (member.user ? member.user.toString() : member._id.toString()) === paidBy.toString()
            );
            if (!isPayeeMember) {
                return res.status(400).json({
                    success: false,
                    message: "The payee must be a member of this group."
                });
            }
            expense.paidBy = paidBy;
        }

        if (amount !== undefined) expense.amount = amount;
        if (description !== undefined) expense.description = description;
        if (category !== undefined) expense.category = category;

        await expense.save();

        res.status(200).json({
            success: true,
            message: "Expense updated successfully.",
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

export const deleteExpense = async (req, res) => {
    try {
        const { expenseId } = req.params;

        const expense = await Expense.findById(expenseId);
        if (!expense) {
            return res.status(404).json({
                success: false,
                message: "Expense not found."
            });
        }

        const group = await Group.findById(expense.group);
        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        // Check if logged-in user is a member of the group
        const isMember = group.members.some(
            member => member.user.toString() === req.user.id.toString()
        );

        if (!isMember) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        await Expense.findByIdAndDelete(expenseId);

        res.status(200).json({
            success: true,
            message: "Expense deleted successfully."
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
 * Scan Receipt with Gemini AI
 */
export const scanReceiptController = async (req, res) => {
    try {
        const { image, mimeType } = req.body;

        if (!image || !mimeType) {
            return res.status(400).json({
                success: false,
                message: "Image (base64) and mimeType are required."
            });
        }

        // Clean base64 string if it contains the data URI prefix (e.g. data:image/png;base64,)
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

        const parsedData = await scanReceipt(base64Data, mimeType);

        res.status(200).json({
            success: true,
            message: "Receipt scanned successfully.",
            data: parsedData
        });

    } catch (error) {
        console.error("Error scanning receipt:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to scan receipt with AI."
        });
    }
};