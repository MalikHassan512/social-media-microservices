import logger from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
    // Log the error
    logger.error(err.stack);

    // Send error response
    res.status(err.status || 500).json({
        status: "error",
        message: err.message || "Internal Server Error",
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
}

export default errorHandler;