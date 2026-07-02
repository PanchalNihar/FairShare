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
        }
    },
    {
        timestamps: true
    }
);

expenseSchema.index({ group: 1 });
expenseSchema.index({ paidBy: 1 });

export default mongoose.model("Expense", expenseSchema);