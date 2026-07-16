import mongoose from "mongoose";

const expenseSchema = new mongoose.Schema(
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

        originalAmount: {
            type: Number,
            required: false
        },

        exchangeRate: {
            type: Number,
            default: 1
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

        expenseDate: {
            type: Date,
            default: Date.now
        },

        paidTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        isSettlement: {
            type: Boolean,
            default: false
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
        ]
    },
    {
        timestamps: true
    }
);

expenseSchema.index({ group: 1 });
expenseSchema.index({ paidBy: 1 });

export default mongoose.model("Expense", expenseSchema);