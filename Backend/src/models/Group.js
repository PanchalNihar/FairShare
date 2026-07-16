import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },

    username: {
        type: String
    },

    email: {
        type: String
    },

    role: {
        type: String,
        enum: ["owner", "member"],
        default: "member"
    },

    joinedAt: {
        type: Date,
        default: Date.now
    }
});

const groupSchema = new mongoose.Schema({

    name: {
        type: String,
        required: true,
        trim: true
    },

    description: {
        type: String,
        default: ""
    },

    inviteCode: {
        type: String,
        unique: true
    },

    currency: {
        type: String,
        default: "INR"
    },

    members: [memberSchema]

}, {
    timestamps: true
});

export default mongoose.model("Group", groupSchema);