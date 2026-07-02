import { nanoid } from "nanoid";
import Group from "../models/Group.js";
import jwt from "jsonwebtoken";
export const createGroup = async (req, res) => {
    try {

        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Group name is required."
            });
        }

        const inviteCode = nanoid(6).toUpperCase();

        const group = await Group.create({

            name,

            description,

            inviteCode,

            members: [
                {
                    user: req.user._id,
                    role: "owner"
                }
            ]

        });

        res.status(201).json({
            success: true,
            message: "Group created successfully.",
            data: group
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};
export const getMyGroups = async (req, res) => {

    try {

        const groups = await Group.find({
            "members.user": req.user._id
        })
        .populate("members.user", "username email avatar")
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: groups
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};
export const joinGroup = async (req, res) => {

    try {

        const { inviteCode } = req.body;

        if (!inviteCode) {
            return res.status(400).json({
                success: false,
                message: "Invite code is required."
            });
        }

        const group = await Group.findOne({
            inviteCode: inviteCode.toUpperCase()
        });

        if (!group) {
            return res.status(404).json({
                success: false,
                message: "Group not found."
            });
        }

        const alreadyMember = group.members.some(
            member => member.user.toString() === req.user._id.toString()
        );

        if (alreadyMember) {
            return res.status(400).json({
                success: false,
                message: "You are already a member."
            });
        }

        group.members.push({
            user: req.user._id,
            role: "member"
        });

        await group.save();

        res.status(200).json({
            success: true,
            message: "Joined group successfully."
        });

    }
    catch(error){

        console.error(error);

        res.status(500).json({
            success:false,
            message:"Internal Server Error"
        });

    }

};