import express from "express";
import searchPostController from "../controllers/search-controller.js";
import { authenticateRequest } from "../middleware/authMiddleware.js";

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateRequest);

// Search routes
router.get("/posts", searchPostController);

export default router;
