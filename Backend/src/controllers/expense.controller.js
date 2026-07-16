import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import jwt from "jsonwebtoken";
import { scanReceipt, quickAddExpense } from "../services/gemini.service.js";
import User from "../models/User.js";
import { getExchangeRate } from "../services/currency.service.js";
import RecurringExpense from "../models/RecurringExpense.js";

/**
 * Create Expense
 */
export const createExpense = async (req, res) => {
    try {

        const {
            groupId,
            amount,
            currency = "INR",
            description,
            category,
            expenseDate,
            paidBy,
            paidTo,
            isSettlement,
            splitType,
            splits
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

        // Currency Conversion Calculation
        const expenseCurrency = currency || group.currency || "INR";
        let exchangeRate = 1;
        let convertedAmount = amount;
        
        if (expenseCurrency !== (group.currency || "INR")) {
            exchangeRate = await getExchangeRate(group.currency || "INR", expenseCurrency);
            convertedAmount = amount / exchangeRate;
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

        if (isSettlement) {
            if (!paidTo) {
                return res.status(400).json({
                    success: false,
                    message: "Recipient is required for settlements."
                });
            }
            const isRecipientMember = group.members.some(
                member => (member.user ? member.user.toString() : member._id.toString()) === paidTo.toString()
            );
            if (!isRecipientMember) {
                return res.status(400).json({
                    success: false,
                    message: "The recipient must be a member of this group."
                });
            }
        }

        // Validate splits if provided
        if (splits && Array.isArray(splits) && splits.length > 0) {
            const finalSplitType = splitType || "equal";
            if (finalSplitType === "exact") {
                const total = splits.reduce((sum, s) => sum + Number(s.value), 0);
                if (Math.abs(total - amount) > 0.05) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of exact split amounts must equal the total expense amount."
                    });
                }
            } else if (finalSplitType === "percentage") {
                const totalPct = splits.reduce((sum, s) => sum + Number(s.value), 0);
                if (Math.abs(totalPct - 100) > 0.05) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of split percentages must equal 100%."
                    });
                }
            } else if (finalSplitType === "shares") {
                const totalShares = splits.reduce((sum, s) => sum + Number(s.value), 0);
                if (totalShares <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of split shares must be greater than zero."
                    });
                }
            }
        }

        // Process splits to store both base values and original values
        let processedSplits = [];
        if (splits && Array.isArray(splits)) {
            processedSplits = splits.map(s => {
                const originalVal = Number(s.value);
                const convertedVal = splitType === "exact" ? (originalVal / exchangeRate) : originalVal;
                return {
                    memberId: s.memberId,
                    value: convertedVal,
                    originalValue: originalVal
                };
            });
        }

        // Create expense
        const expense = await Expense.create({

            group: groupId,

            paidBy: payeeId,

            amount: convertedAmount,

            originalAmount: amount,

            currency: expenseCurrency,

            exchangeRate,

            description,

            category: category || (isSettlement ? "Settlement" : "Other"),

            expenseDate: expenseDate || Date.now(),

            paidTo: isSettlement ? paidTo : undefined,

            isSettlement: isSettlement || false,

            splitType: splitType || "equal",

            splits: processedSplits || []

        });

        res.status(201).json({
            success: true,
            message: isSettlement ? "Settlement recorded successfully." : "Expense added successfully.",
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
        const { amount, currency, description, category, paidBy, expenseDate, splitType, splits } = req.body;

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

        const expenseCurrency = currency !== undefined ? currency : (expense.currency || "INR");
        const originalAmountVal = amount !== undefined ? amount : (expense.originalAmount || expense.amount);
        
        let exchangeRate = expense.exchangeRate || 1;
        let convertedAmount = expense.amount;
        
        if (amount !== undefined || currency !== undefined) {
            if (expenseCurrency !== (group.currency || "INR")) {
                exchangeRate = await getExchangeRate(group.currency || "INR", expenseCurrency);
                convertedAmount = originalAmountVal / exchangeRate;
            } else {
                exchangeRate = 1;
                convertedAmount = originalAmountVal;
            }
        }

        const finalSplitType = splitType !== undefined ? splitType : expense.splitType;
        const finalSplits = splits !== undefined 
            ? splits 
            : expense.splits.map(s => ({ memberId: s.memberId, value: s.originalValue || s.value }));

        if (finalSplits && finalSplits.length > 0) {
            if (finalSplitType === "exact") {
                const total = finalSplits.reduce((sum, s) => sum + Number(s.value), 0);
                if (Math.abs(total - originalAmountVal) > 0.05) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of exact split amounts must equal the total expense amount."
                    });
                }
            } else if (finalSplitType === "percentage") {
                const totalPct = finalSplits.reduce((sum, s) => sum + Number(s.value), 0);
                if (Math.abs(totalPct - 100) > 0.05) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of split percentages must equal 100%."
                    });
                }
            } else if (finalSplitType === "shares") {
                const totalShares = finalSplits.reduce((sum, s) => sum + Number(s.value), 0);
                if (totalShares <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of split shares must be greater than zero."
                    });
                }
            }
        }

        let processedSplits = undefined;
        if (splits !== undefined) {
            processedSplits = splits.map(s => {
                const originalVal = Number(s.value);
                const convertedVal = finalSplitType === "exact" ? (originalVal / exchangeRate) : originalVal;
                return {
                    memberId: s.memberId,
                    value: convertedVal,
                    originalValue: originalVal
                };
            });
        } else if (finalSplitType === "exact" && (amount !== undefined || currency !== undefined)) {
            processedSplits = expense.splits.map(s => {
                const originalVal = s.originalValue || s.value;
                return {
                    memberId: s.memberId,
                    value: originalVal / exchangeRate,
                    originalValue: originalVal
                };
            });
        }

        expense.amount = convertedAmount;
        expense.originalAmount = originalAmountVal;
        expense.currency = expenseCurrency;
        expense.exchangeRate = exchangeRate;

        if (description !== undefined) expense.description = description;
        if (category !== undefined) expense.category = category;
        if (expenseDate !== undefined) expense.expenseDate = expenseDate;
        if (splitType !== undefined) expense.splitType = splitType;
        if (processedSplits !== undefined) expense.splits = processedSplits;

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

/**
 * Parse Natural Language Expense with Gemini AI via LangChain
 */
export const quickAddController = async (req, res) => {
    try {
        const { text, members = [] } = req.body;

        if (!text) {
            return res.status(400).json({
                success: false,
                message: "Input text is required."
            });
        }

        const parsedData = await quickAddExpense(text, members);

        res.status(200).json({
            success: true,
            message: "Sentence parsed successfully.",
            data: parsedData
        });

    } catch (error) {
        console.error("Error in quickAddController:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Failed to parse sentence with AI."
        });
    }
};

/**
 * Create Recurring Expense Rule
 */
export const createRecurringExpense = async (req, res) => {
    try {
        const {
            groupId,
            amount,
            currency = "INR",
            description,
            category,
            startDate,
            frequency = "monthly",
            paidBy,
            splitType,
            splits
        } = req.body;

        if (!groupId || !amount || !description) {
            return res.status(400).json({
                success: false,
                message: "Group, amount and description are required."
            });
        }

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
                message: "You are not a member of this group."
            });
        }

        const payeeId = paidBy || req.user.id;

        // Validate splits if provided
        if (splits && Array.isArray(splits) && splits.length > 0) {
            const finalSplitType = splitType || "equal";
            if (finalSplitType === "exact") {
                const total = splits.reduce((sum, s) => sum + Number(s.value), 0);
                if (Math.abs(total - amount) > 0.05) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of exact split amounts must equal the total recurring amount."
                    });
                }
            } else if (finalSplitType === "percentage") {
                const totalPct = splits.reduce((sum, s) => sum + Number(s.value), 0);
                if (Math.abs(totalPct - 100) > 0.05) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of split percentages must equal 100%."
                    });
                }
            } else if (finalSplitType === "shares") {
                const totalShares = splits.reduce((sum, s) => sum + Number(s.value), 0);
                if (totalShares <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: "The sum of split shares must be greater than zero."
                    });
                }
            }
        }

        // Process splits to save both original values
        let processedSplits = [];
        if (splits && Array.isArray(splits)) {
            processedSplits = splits.map(s => {
                const originalVal = Number(s.value);
                return {
                    memberId: s.memberId,
                    value: originalVal,
                    originalValue: originalVal
                };
            });
        }

        const start = startDate ? new Date(startDate) : new Date();

        const recurringExpense = await RecurringExpense.create({
            group: groupId,
            paidBy: payeeId,
            amount,
            currency,
            description,
            category: category || "Other",
            splitType: splitType || "equal",
            splits: processedSplits || [],
            frequency,
            startDate: start,
            nextDueDate: start
        });

        res.status(201).json({
            success: true,
            message: "Recurring expense rule created successfully.",
            data: recurringExpense
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
 * Get Group Recurring Expense Rules
 */
export const getGroupRecurringExpenses = async (req, res) => {
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

        const recurringExpenses = await RecurringExpense.find({
            group: groupId
        })
        .populate("paidBy", "username email avatar")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: recurringExpenses
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
 * Toggle Recurring Expense Active State
 */
export const updateRecurringExpenseStatus = async (req, res) => {
    try {
        const { recurringId } = req.params;
        const { isActive } = req.body;

        const recurringRule = await RecurringExpense.findById(recurringId);
        if (!recurringRule) {
            return res.status(404).json({
                success: false,
                message: "Recurring rule not found."
            });
        }

        const group = await Group.findById(recurringRule.group);
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

        if (isActive !== undefined) {
            recurringRule.isActive = isActive;
        }

        await recurringRule.save();

        res.status(200).json({
            success: true,
            message: `Recurring rule ${isActive ? "activated" : "deactivated"} successfully.`,
            data: recurringRule
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
 * Delete Recurring Expense Rule
 */
export const deleteRecurringExpense = async (req, res) => {
    try {
        const { recurringId } = req.params;

        const recurringRule = await RecurringExpense.findById(recurringId);
        if (!recurringRule) {
            return res.status(404).json({
                success: false,
                message: "Recurring rule not found."
            });
        }

        const group = await Group.findById(recurringRule.group);
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

        await RecurringExpense.findByIdAndDelete(recurringId);

        res.status(200).json({
            success: true,
            message: "Recurring rule deleted successfully."
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};