import express from 'express';
import multer from 'multer';
import uploadMedia, {getAllMedia} from '../controllers/media-controller.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';
import logger from '../utils/logger.js';

const router = express.Router();

//configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // limit file size to 10MB
}).single('file'); // expecting a single file with the field name 'file'
 
// Route to upload media
router.post('/upload', authenticateRequest, (req, res, next) => {
    upload(req, res, (err) => {
        if (err) {
            logger.error("Multer error:", err);
            return res.status(400).json({
                message: "File upload failed", error: err.message,
                stack: err.stack
             });
        } else if (err) {
            logger.error("Error during file upload:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }

        if (!req.file) {
            logger.error("No file found in request");
            return res.status(400).json({ message: "No file found" });
        }

        next(); // proceed to the controller
        // uploadMedia(req, res);
    });
}, uploadMedia);

router.get('/get', authenticateRequest, getAllMedia);

export default router;