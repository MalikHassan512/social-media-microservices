import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import mediaRoutes from "./routes/media-routes.js";
import errorHandler from "./middleware/errorHandler.js";
import logger from "./utils/logger.js";
import mongoose from "mongoose";
import { connectToRabbitMQ, consumeEvent } from "./utils/rabbitmq.js";
import { handlePostDeleted } from "./eventHandlers/media-event-handlers.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3003;

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("Error connecting to MongoDB:", error);
  });

app.use(helmet()); // Security middleware to set various HTTP headers
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Middleware to parse JSON requests

app.use((req, res, next) => {
  logger.info(`Received request: ${req.method} ${req.url}`);
  next(); // Call the next middleware or route handler
});

app.use("/api/media", mediaRoutes); // Mount media routes

app.use(errorHandler); // Global error handler

async function startServer() {
  try {
    await connectToRabbitMQ();
    logger.info("RabbitMQ connection established");
    console.log("post.deleted event consumer is starting...");
    await consumeEvent("post.deleted", handlePostDeleted);
    app.listen(PORT, () => {
      logger.info(`Media service is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Error establishing RabbitMQ connection:", error);
    process.exit(1); // Exit the process if RabbitMQ connection fails
  }
}

startServer();

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
});
