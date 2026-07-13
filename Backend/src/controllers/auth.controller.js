import bcrypt from "bcrypt";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendToken from "../utils/sendToken.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { OAuth2Client } from "google-auth-library";
export const signup = async (req, res) => {
  try {
    const { username, email, password, mobileNumber } = req.body;

    // Validation
    if (!username || !email || !password || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    // Check existing email
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // Check existing mobile number
    const existingMobile = await User.findOne({ mobileNumber });
    if (existingMobile) {
      return res.status(409).json({
        success: false,
        message: "Mobile number already exists.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
      mobileNumber
    });

    // Generate JWT
    const token = generateToken(user._id);

    // Send cookie
    sendToken(res, token);

    return res.status(201).json({
    success: true,
    message: "Account created successfully.",
    data: {
        token,
        user: {
            id: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            mobileNumber: user.mobileNumber
        }
    }
});
  } catch (error) {
    console.error("Signup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    sendToken(res, token);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};


export const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const searchUsers = async (req, res) => {
  try {
    const { search } = req.query;

    if (!search) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const users = await User.find({
      $and: [
        {
          $or: [
            {
              username: {
                $regex: search,
                $options: "i",
              },
            },
            {
              email: {
                $regex: search,
                $options: "i",
              },
            },
          ],
        },
        {
          _id: {
            $ne: new mongoose.Types.ObjectId(req.user._id),
          },
        },
      ],
    }).select("_id username email avatar");

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
export const logout = async (req, res) => {

    try {

        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully."
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }

};

export const updateProfile = async (req, res) => {
  try {
    const { username, email, avatar, mobileNumber } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (username) user.username = username;
    
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }
      user.email = email.toLowerCase();
    }

    if (mobileNumber !== undefined) {
      if (mobileNumber && mobileNumber !== user.mobileNumber) {
        const existingMobile = await User.findOne({ mobileNumber });
        if (existingMobile) {
          return res.status(409).json({
            success: false,
            message: "Mobile number already exists.",
          });
        }
      }
      user.mobileNumber = mobileNumber || undefined;
    }

    if (avatar !== undefined) {
      user.avatar = avatar;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        mobileNumber: user.mobileNumber
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Google ID Token is required."
      });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Find user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email: email.toLowerCase() }] });
    if (!user) {
      // Create new user with placeholder password
      const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);
      user = await User.create({
        username: name,
        email: email.toLowerCase(),
        password: dummyPassword,
        googleId,
        avatar: picture || ""
      });
    } else if (!user.googleId) {
      // Link existing local account to Google
      user.googleId = googleId;
      if (!user.avatar && picture) user.avatar = picture;
      await user.save();
    }

    const token = generateToken(user._id);
    sendToken(res, token);

    return res.status(200).json({
      success: true,
      message: "Google Sign-in successful.",
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          mobileNumber: user.mobileNumber
        }
      }
    });
  } catch (error) {
    console.error("Google verify error:", error);
    return res.status(401).json({
      success: false,
      message: "Invalid Google credential token."
    });
  }
};