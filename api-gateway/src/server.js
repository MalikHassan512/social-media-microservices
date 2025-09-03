import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import Redis from "ioredis";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import proxy from "express-http-proxy";
import logger from "./utils/logger.js";
import errorHandler from "./middleware/errorHanlder.js";
import validateToken from "./middleware/authMiddleware.js";

const app = express();
dotenv.config();
const PORT = process.env.PORT || 3000;
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL;
const REDIS_URL = process.env.REDIS_URL;

const redisClient = new Redis(process.env.REDIS_URL);

app.use(cors());
app.use(helmet());
app.use(express.json());

// rate limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for sensitive endpoint: ${req.ip}`), // Log rate limit exceeded
      res.status(429).json({
        success: false,
        message: "Too many requests to this endpoint, please try again later.",
      }); // Respond with 429 Too Many Requests
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args), // Use ioredis to send commands
  }),
});

app.use(rateLimiter);

app.use((req, res, next) => {
  logger.info(`Received request: ${req.method} ${req.url}`);
  logger.info(`Request body: ${JSON.stringify(req.body)}`); // Log request body for debugging
  next(); // Call the next middleware or route handler
});

const proxyOptions = {
  proxyReqPathResolver: (req, res, next) => {
    return req.originalUrl.replace(/^\/v1/, "/api");
  },
  proxyErrorHandler: (err, res, next) => {
    logger.error(`Proxy error: ${err.message}`);
    res.status(502).json({
      success: false,
      message: "Bad Gateway: Unable to reach the service.",
      err: err.message,
    });
  },
};

// setting proxy for our identity service
app.use(
  "/v1/auth",
  proxy(process.env.IDENTITY_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response from identity service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

// setting proxy for our posts service
app.use(
  "/v1/posts",
  validateToken,
  proxy(process.env.POSTS_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["Content-Type"] = "application/json";
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response from Post service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

// setting proxy for our media service
app.use(
  "/v1/media",
  validateToken,
  proxy(process.env.MEDIA_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      if (!srcReq.headers["content-type"].startsWith("multipart/form-data")) {
        proxyReqOpts.headers["Content-Type"] = "application/json";
      }
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response from Media service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
    parseReqBody: false, // Disable body parsing for file uploads
  })
);

// setting proxy for our search service
app.use(
  "/v1/search",
  validateToken,
  proxy(process.env.SEARCH_SERVICE_URL, {
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts, srcReq) => {
      proxyReqOpts.headers["x-user-id"] = srcReq.user.userId;
      return proxyReqOpts;
    },
    userResDecorator: (proxyRes, proxyResData, userReq, userRes) => {
      logger.info(`Response from Search service: ${proxyRes.statusCode}`);
      return proxyResData;
    },
  })
);

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`API Gateway is running on port ${PORT}`);
  logger.info(`Identity Service URL: ${IDENTITY_SERVICE_URL}`);
  logger.info(`Posts Service URL: ${process.env.POSTS_SERVICE_URL}`);
  logger.info(`Media Service URL: ${process.env.MEDIA_SERVICE_URL}`);
  logger.info(`Search Service URL: ${process.env.SEARCH_SERVICE_URL}`);
  logger.info(`Redis URL: ${process.env.REDIS_URL}`);
});
