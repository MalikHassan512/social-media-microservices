import Media from "../models/Media.js"
import { uploadMediaToCloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

const uploadMedia = async (req, res, ) => {
    try {
        console.log("req.file", req.file);
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const { originalname, buffer, mimetype } = req.file;
        const userId = req.user.userId;

        logger.info("Uploading media to Cloudinary...");
        logger.debug("File details:", {
            originalName: originalname,
            mimeType: mimetype,
            userId: userId,
        });
        const cloudinaryResult = await uploadMediaToCloudinary(req.file);
        logger.info("Media uploaded successfully to Cloudinary", cloudinaryResult.public_id);

        console.log("mimeType", mimetype);
        console.log("userId", userId);

        const newlyCreatedMedia = new Media({
            publicId: cloudinaryResult.public_id,
            originalName: originalname,
            mimeType: mimetype,
            url: cloudinaryResult.secure_url,
            userId: userId,
        });
        await newlyCreatedMedia.save();

        logger.info("Media saved to database successfully", newlyCreatedMedia._id);
        res.status(201).json({
            message: "Media uploaded successfully",
            media: {
                id: newlyCreatedMedia._id,
                originalName: newlyCreatedMedia.originalName,
                mimeType: newlyCreatedMedia.mimeType,
                url: newlyCreatedMedia.url, 
                userId: newlyCreatedMedia.userId,
            },
        });

        
    } catch (error) {
        logger.error("Error uploading media:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to upload media",
            error: error.message,
        });
    }
}

export const getAllMedia = async (req, res) => {
    try {
        const media = await Media.find({ });
        res.status(200).json({
            status: "success",
            data: media,
        }); 
    } catch (error) {
        logger.error("Error fetching media:", error);
        res.status(500).json({
            status: "error",
            message: "Failed to fetch media",
            error: error.message,
        });
    }
}

export default uploadMedia;