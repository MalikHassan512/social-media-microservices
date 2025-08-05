import logger from "../utils/logger.js";

const authenticateRequest = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
        logger.error("Authentication failed: No user ID provided");
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    req.user = { userId };
    next();

}

export {
    authenticateRequest
}