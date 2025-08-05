import dotenv from 'dotenv';
import mongoose from 'mongoose';
import logger from './utils/logger.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { RateLimiterRedis } from 'rate-limiter-flexible';
import Redis from 'ioredis';
import { rateLimit } from 'express-rate-limit';
import { RedisStore } from "rate-limit-redis"
import routes from './routes/identity-service.js'
import errorHandler from './middleware/errorHanlder.js';


const app = express();
dotenv.config();
const PORT = process.env.PORT || 3001;

// Initialize Redis client for rate limiting
const redisClient = new Redis(process.env.REDIS_URL);


mongoose.connect(process.env.MONGODB_URI)   
.then(() => {
    logger.info('Connected to MongoDB');
})
.catch((error) => {
    logger.error('Error connecting to MongoDB:', error);
    process.exit(1); // Exit the process if connection fails
});


app.use(helmet()); // Security middleware to set various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON requests

app.use((req, res, next) => {
    logger.info(`Received request: ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`); // Log request body for debugging
    next(); // Call the next middleware or route handler
});

//DDos protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'rateLimiter',
    points: 100, // 100 requests
    duration: 60, // per minute
});

app.use((req, res, next) => {
    rateLimiter.consume(req.ip) // Consume a point for the request
        .then(() => {
            next(); // Proceed to the next middleware or route handler
        })
        .catch(() => {
            logger.warn(`Rate limit exceeded for IP: ${req.ip}`); // Log rate limit exceeded
            res.status(429).json({
                success: false,
                message: 'Too many requests, please try again later.',
            }); // Respond with 429 Too Many Requests
        }
    );
}
);

//Ip based rate limiting for sensitive endpoints
const sensitiveRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn(`Rate limit exceeded for sensitive endpoint: ${req.ip}`), // Log rate limit exceeded
        res.status(429).json({
            success: false,
            message: 'Too many requests to this endpoint, please try again later.',
        }); // Respond with 429 Too Many Requests
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args), // Use ioredis to send commands
    }),
    
});

//apply sensitive rate limiter to specific routes
app.use('/api/auth/register', sensitiveRateLimiter);

//Routes
app.use('/api/auth', routes);


//error handler
app.use(errorHandler)

app.listen(PORT, () => {
    logger.info(`Identity Service is running on port ${PORT}`);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally, you can exit the process or handle it gracefully
});