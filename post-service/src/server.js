import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import Redis from 'ioredis';
import helmet from 'helmet';
import errorHandler from './middleware/errorHandler.js';
import postRoutes from './routes/post-routes.js';
import logger from './utils/logger.js';
import { connectToRabbitMQ, consumeEvent } from './utils/rabbitmq.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3002;

mongoose.connect(process.env.MONGODB_URI).then(() => {
    logger.info('Connected to MongoDB');
}).catch((err) => {
    logger.error('MongoDB connection error:', err);
});

const redisClient = new Redis(process.env.REDIS_HOST);

app.use(helmet()); // Security middleware to set various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON requests

app.use((req, res, next) => {
    logger.info(`Received request: ${req.method} ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`); // Log request body for debugging
    next(); // Call the next middleware or route handler
});

//routes
app.use('/api/posts', (req, res, next) => {
    req.redisClient = redisClient; // Attach Redis client to request object
    next();
}, postRoutes);

// Error handling middleware
app.use(errorHandler);

async function startServer() {
    try {
        await connectToRabbitMQ();
        logger.info('RabbitMQ connection established');
        await consumeEvent('post.deleted')
        app.listen(PORT, () => {
            logger.info(`Media service is running on port ${PORT}`);
        });
    } catch (error) {
        logger.error('Error establishing RabbitMQ connection:', error)
        process.exit(1); // Exit the process if RabbitMQ connection fails
    }
}

startServer();



process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Optionally, you can exit the process or handle it gracefully
});