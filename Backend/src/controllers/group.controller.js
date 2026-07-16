import { nanoid } from "nanoid";
import Group from "../models/Group.js";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import Expense from "../models/Expense.js";

const formatGroupMembers = (group) => {
  if (!group) return null;
  const groupObj = group.toObject ? group.toObject() : group;
  if (groupObj.members) {
    groupObj.members = groupObj.members.map((member) => {
      if (!member.user) {
        member.user = {
          _id: member._id,
          username: member.username,
          email: member.email || "temp@fairshare.fake",
          avatar: ""
        };
      }
      return member;
    });
  }
  return groupObj;
};

export const createGroup = async (req, res) => {
  try {
    const { name, description, members = [], currency = "INR" } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Group name is required.",
      });
    }

    const inviteCode = nanoid(6).toUpperCase();

    const groupMembers = [
      {
        user: req.user._id,
        role: "owner",
      },
    ];

    if (members.length > 0) {
      const existingMemberIds = [];
      const newMembers = [];

      members.forEach((m) => {
        if (typeof m === "string") {
          existingMemberIds.push(m);
        } else if (m && typeof m === "object" && m.username) {
          newMembers.push(m);
        }
      });

      const users = await User.find({
        _id: { $in: existingMemberIds },
      });

      users.forEach((user) => {
        if (user._id.toString() !== req.user._id.toString()) {
          groupMembers.push({
            user: user._id,
            role: "member",
          });
        }
      });

      for (const newM of newMembers) {
        let emailToUse = newM.email;
        let isFakeEmail = !emailToUse || emailToUse.endsWith("@fairshare.fake");

        let user = null;
        if (!isFakeEmail) {
          user = await User.findOne({ email: emailToUse.toLowerCase() });
        }

        if (user) {
          const isAlreadyAdded = groupMembers.some(
            (m) => m.user && m.user.toString() === user._id.toString()
          );
          if (!isAlreadyAdded && user._id.toString() !== req.user._id.toString()) {
            groupMembers.push({
              user: user._id,
              role: "member",
            });
          }
        } else {
          groupMembers.push({
            username: newM.username,
            email: "temp@fairshare.fake",
            role: "member",
          });
        }
      }
    }

    const group = await Group.create({
      name,
      description,
      inviteCode,
      members: groupMembers,
      currency
    });

    const populatedGroup = await Group.findById(group._id).populate(
      "members.user",
      "username email avatar"
    );

    const formattedGroup = formatGroupMembers(populatedGroup);

    res.status(201).json({
      success: true,
      message: "Group created successfully.",
      data: formattedGroup,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
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

        const formattedGroups = groups.map(g => formatGroupMembers(g));

        res.status(200).json({
            success: true,
            data: formattedGroups
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

export const addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, username, email } = req.body;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const owner = group.members.find(
      (m) =>
        m.user &&
        m.user.toString() === req.user._id.toString() &&
        m.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({
        success: false,
        message: "Only owner can add members.",
      });
    }

    let isTempMember = false;
    let tempUsername = "";
    let tempEmail = "";
    let targetUserId = userId;

    if (!targetUserId && username) {
      let emailToUse = email;
      let isFakeEmail = !emailToUse || emailToUse.endsWith("@fairshare.fake");

      let user = null;
      if (!isFakeEmail) {
        user = await User.findOne({ email: emailToUse.toLowerCase() });
      }

      if (user) {
        targetUserId = user._id.toString();
      } else {
        isTempMember = true;
        tempUsername = username;
        tempEmail = "temp@fairshare.fake";
      }
    }

    if (isTempMember) {
      const exists = group.members.find(
        (m) => !m.user && m.username === tempUsername
      );

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "User already exists in the group.",
        });
      }

      group.members.push({
        username: tempUsername,
        email: tempEmail,
        role: "member",
      });
    } else {
      if (!targetUserId) {
        return res.status(400).json({
          success: false,
          message: "User identifier is required.",
        });
      }

      const exists = group.members.find(
        (m) => m.user && m.user.toString() === targetUserId
      );

      if (exists) {
        return res.status(400).json({
          success: false,
          message: "User already exists.",
        });
      }

      group.members.push({
        user: targetUserId,
        role: "member",
      });
    }

    await group.save();

    res.json({
      success: true,
      message: "Member added successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const owner = group.members.find(
      (m) =>
        m.user &&
        m.user.toString() === req.user._id.toString() &&
        m.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({
        success: false,
        message: "Only owner can remove members.",
      });
    }

    group.members = group.members.filter((m) => {
      const memberUserId = m.user ? m.user.toString() : m._id.toString();
      return memberUserId !== userId;
    });

    await group.save();

    res.json({
      success: true,
      message: "Member removed successfully.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found.",
      });
    }

    const owner = group.members.find(
      (m) =>
        m.user.toString() === req.user._id.toString() &&
        m.role === "owner"
    );

    if (!owner) {
      return res.status(403).json({
        success: false,
        message: "Only owner can delete the group.",
      });
    }

    // Delete all expenses of this group
    await Expense.deleteMany({ group: groupId });

    // Delete the group itself
    await Group.findByIdAndDelete(groupId);

    res.json({
      success: true,
      message: "Group deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};