import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import errorHandler from "./middleware/errorHandler.js";
import Redis from "ioredis";
import logger from "./utils/logger.js";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import searchRoutes from "./routes/search-routes.js";
import {
  handlePostCreatedEvent,
  handlePostDeletedEvent,
} from "./eventHandlers/search-event-handler.js";

dotenv.config();

const app = express();
const redis = new Redis(process.env.REDIS_URL || 6379);
// Test Redis connection
redis.set("test_key", "test_value");
redis.get("test_key", (err, result) => {
  if (err) {
    logger.error("Redis test failed:", err);
  } else {
    logger.info("Redis test value:", result);
  }
});
const PORT = process.env.PORT || 3004;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((err) => {
    logger.error("MongoDB connection error:", err);
  });

app.use(helmet()); // Security middleware to set various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON requests

// Attach redis client to each request
app.use((req, res, next) => {
  req.redisClient = redis;
  logger.info(`Received request: ${req.method} ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`); // Log request body for debugging
  next();
});

// Routes
app.use("/api/search", searchRoutes);

app.use(errorHandler); // Centralized error handling middleware

async function startServer() {
  try {
    await connectToRabbitMQ();
    await consumeEvent("post.created", handlePostCreatedEvent);
    await consumeEvent("post.deleted", handlePostDeletedEvent);

    // Start the Express server
    app.listen(PORT, () => {
      logger.info(`Search service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error starting search server:", error);
    process.exit(1);
  }
}

startServer();
