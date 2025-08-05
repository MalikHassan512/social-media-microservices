import logger from "../utils/logger.js";
import { validateLogin, validateRegistration } from "../utils/validation.js";
import User from "../models/User.js"; // Assuming your User model is in models/user.js
import generateToken from "../utils/generateToken.js";
import RefreshToken from "../models/RefreshToken.js";

//user registration
const registerUser = async (req, res, next) => {
    logger.info("Received registration request");
    try {
        const { error } = validateRegistration(req.body);
        if (error) {
            logger.warn("Validation error:", error.details[0].message);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        // Assuming User is a Mongoose model for user data
        const { username, email, password } = req.body;

        let user = await User.findOne({ $or: [{email}, {username}] });
        if (user) {
            logger.warn("User already exists:", username || email);
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        user = new User({
            username,
            email,
            password, // Ensure password is hashed in the User model or before saving
        });
        await user.save();
        logger.info("User registered successfully:", user._id);

        const { accessToken, refreshToken } = await generateToken(user);
        
        return res.status(201).json({
            success: true,
            message: "User registered successfully",
            accessToken,
            refreshToken,
        });
    } catch (error) {
        logger.error("Error during user registration:", error);
          res.status(500).json({
          success: false,
          message: "Internal server error",
    });
        next(error); // Pass error to error handler middleware
    }
}

//user login
const loginUser = async (req, res) => {
    logger.info("Received login request");
    try {
        const { error } = validateLogin(req.body);
        if (error) {
            logger.warn("Validation error:", error.details[0].message);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            logger.warn("User not found:", email);
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const isValidPassword = await user.comparePassword(password); 
        if (!isValidPassword) {
            logger.warn("Invalid password for user:", email);
            return res.status(401).json({ success: false, message: "Invalid password" });
        }
        logger.info("User logged in successfully:", user._id);
        const { accessToken, refreshToken } = await generateToken(user);
        return res.status(200).json({
            success: true,
            message: "User logged in successfully",
            accessToken,
            refreshToken,
            userId: user._id,
        });
    } catch (error) {
        logger.error("Error during user login:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}


//refresh token
const refreshTokenController = async (req, res) => {
    logger.info("Received refresh token request");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("Refresh token is required");
            return res.status(400).json({ success: false, message: "Refresh token is required" });
        }
        // Verify and decode the refresh token
        const storedToken = await RefreshToken.findOne({ token: refreshToken });
        if (!storedToken || storedToken.expiresAt < Date.now()) {
            logger.warn("Invalid or expired refresh token");
            return res.status(401).json({
                success: false, message: "Invalid refresh token"
            });
        }
        // Find the user by ID from the decoded token
        const user = await User.findById(storedToken.user);
        if (!user) {
            logger.warn("User not found for refresh token:");
            return res.status(404).json({ success: false, message: "User not found in refresh_token" });
        }
        // Generate new access and refresh tokens
        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateToken(user);
        
        //delete the old refresh token
        await RefreshToken.deleteOne({ _id: storedToken._id });
        
        return res.status(200).json({
            success: true,
            message: "Tokens refreshed successfully",
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
        });

    } catch (error) {
        logger.error("Error during token refresh:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}


//logout user
const logoutUser = async (req, res) => { 
    logger.info("Received logout request");
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            logger.warn("Refresh token is required for logout");
            return res.status(400).json({ success: false, message: "Refresh token is missing in logout" });
        }

        await RefreshToken.deleteOne({ token: refreshToken });
        logger.info("User logged out successfully, refresh token deleted");
        return res.status(200).json({
            success: true,
            message: "User logged out successfully",
        });
    } catch (error) {
        logger.error("Error during user logout:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}


export {
    registerUser,
    loginUser,
    refreshTokenController,
    logoutUser
};