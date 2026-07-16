import RecurringExpense from "../models/RecurringExpense.js";
import Expense from "../models/Expense.js";
import Group from "../models/Group.js";
import { getExchangeRate } from "./currency.service.js";

export const checkRecurringExpenses = async () => {
    try {
        console.log("[Scheduler] Checking for due recurring expenses...");
        const now = new Date();
        
        // Find active rules where nextDueDate <= now
        const dueRules = await RecurringExpense.find({
            isActive: true,
            nextDueDate: { $lte: now }
        });
        
        if (dueRules.length === 0) {
            return;
        }
        
        console.log(`[Scheduler] Found ${dueRules.length} due recurring rules. Processing...`);
        
        for (const rule of dueRules) {
            // 1. Fetch group base currency
            const group = await Group.findById(rule.group);
            if (!group) {
                console.error(`[Scheduler] Group ${rule.group} not found for rule ${rule._id}. Skipping.`);
                continue;
            }
            
            const groupCurrency = group.currency || "INR";
            const expenseCurrency = rule.currency || "INR";
            let exchangeRate = 1;
            let convertedAmount = rule.amount;
            
            // 2. Perform currency conversion if needed
            if (expenseCurrency !== groupCurrency) {
                exchangeRate = await getExchangeRate(groupCurrency, expenseCurrency);
                convertedAmount = rule.amount / exchangeRate;
            }
            
            // 3. Process splits for the converted value if exact
            let processedSplits = [];
            if (rule.splits && rule.splits.length > 0) {
                processedSplits = rule.splits.map(s => {
                    const originalVal = Number(s.originalValue || s.value);
                    const convertedVal = rule.splitType === "exact" ? (originalVal / exchangeRate) : originalVal;
                    return {
                        memberId: s.memberId,
                        value: convertedVal,
                        originalValue: originalVal
                    };
                });
            }
            
            // 4. Create standard group Expense record
            const newExpense = await Expense.create({
                group: rule.group,
                paidBy: rule.paidBy,
                amount: convertedAmount,
                originalAmount: rule.amount,
                currency: expenseCurrency,
                exchangeRate,
                description: rule.description,
                category: rule.category || "Other",
                expenseDate: now,
                splitType: rule.splitType,
                splits: processedSplits
            });
            
            console.log(`[Scheduler] Created expense "${rule.description}" of ${rule.amount} ${expenseCurrency} in Group ${group.name}.`);
            
            // 5. Compute the nextDueDate based on frequency
            const nextDueDate = new Date(rule.nextDueDate);
            if (rule.frequency === "daily") {
                nextDueDate.setDate(nextDueDate.getDate() + 1);
            } else if (rule.frequency === "weekly") {
                nextDueDate.setDate(nextDueDate.getDate() + 7);
            } else if (rule.frequency === "monthly") {
                nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            } else if (rule.frequency === "yearly") {
                nextDueDate.setFullYear(nextDueDate.getFullYear() + 1);
            } else {
                nextDueDate.setMonth(nextDueDate.getMonth() + 1); // default monthly
            }
            
            rule.nextDueDate = nextDueDate;
            rule.lastTriggeredAt = now;
            await rule.save();
        }
        
        console.log("[Scheduler] Recurring expenses check completed.");
    } catch (error) {
        console.error("[Scheduler] Error checking recurring expenses:", error);
    }
};

export const startScheduler = () => {
    // Run immediately on server start after a brief delay
    setTimeout(() => {
        checkRecurringExpenses();
    }, 5000);
    
    // Check every 1 minute for local verification/development
    setInterval(() => {
        checkRecurringExpenses();
    }, 60000);
};
