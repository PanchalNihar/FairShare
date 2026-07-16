import mongoose from "mongoose";

const recurringExpenseSchema = new mongoose.Schema(
    {
        group: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Group",
            required: true
        },

        paidBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        amount: {
            type: Number,
            required: true,
            min: 0
        },

        currency: {
            type: String,
            default: "INR"
        },

        description: {
            type: String,
            required: true,
            trim: true
        },

        category: {
            type: String,
            default: "Other"
        },

        splitType: {
            type: String,
            enum: ["equal", "exact", "percentage", "shares"],
            default: "equal"
        },

        splits: [
            {
                memberId: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true
                },
                value: {
                    type: Number,
                    required: true
                },
                originalValue: {
                    type: Number
                }
            }
        ],

        frequency: {
            type: String,
            enum: ["daily", "weekly", "monthly", "yearly"],
            default: "monthly"
        },

        startDate: {
            type: Date,
            default: Date.now
        },

        nextDueDate: {
            type: Date,
            required: true
        },

        lastTriggeredAt: {
            type: Date
        },

        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

recurringExpenseSchema.index({ group: 1 });
recurringExpenseSchema.index({ nextDueDate: 1, isActive: 1 });

export default mongoose.model("RecurringExpense", recurringExpenseSchema);
