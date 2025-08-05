import logger from "../utils/logger.js";
import jwt from "jsonwebtoken";

const validateToken = (req, res, next) => {
    const authToken = req.headers['authorization'];
    const token = authToken && authToken.split(' ')[1]; // Extract token from Bearer scheme

    if (!token) {
        logger.warn('No token provided in validateToken middleware');
        return res.status(401).json({ success: false, message: 'No token provided validateToken middleware' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn('Invalid token');
            return res.status(403).json({ success: false, message: 'Invalid token' });
        }
        req.user = user; // Attach user information to request object
        next(); // Proceed to the next middleware or route handler
    });
};

export default validateToken;