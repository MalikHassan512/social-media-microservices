import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import logger from './logger.js';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadMediaToCloudinary = async (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if (error) {
                    logger.error('Cloudinary upload error:', error);
                    return reject(error);
                }
                resolve(result);
            }
        );
        uploadStream.end(file.buffer);
    });
};

export const deleteMediaFromCloudinary = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        logger.info(`Media with public ID ${publicId} deleted from Cloudinary`);
        return result;
    } catch (error) {
        logger.error('Cloudinary delete error:', error);
        throw error;
    }
}

export default cloudinary;
