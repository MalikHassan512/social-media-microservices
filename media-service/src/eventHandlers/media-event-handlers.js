import Media from "../models/Media.js";
import { deleteMediaFromCloudinary } from "../utils/cloudinary.js";
import logger from "../utils/logger.js";

export const handlePostDeleted = async (event) => {
  const { postId, mediaIds } = event;
  try {
    logger.info(`Handling post deleted event for post ID: ${postId}`);
    console.log("event", event);

    const mediaToDelete = await Media.find({ _id: { $in: mediaIds } });
    for (const media of mediaToDelete) {
      await deleteMediaFromCloudinary(media.publicId);
      await Media.findByIdAndDelete(media._id);
      logger.info(
        `Deleted media with ID: ${media._id} and public ID: ${media.publicId}`
      );
    }
    logger.info(
      `Successfully handled post deleted event for post ID: ${postId}`
    );

    // Logic to handle the post deletion, e.g., remove media associated with the post
    // This could involve deleting files from storage or updating the database
  } catch (error) {
    logger.error("Error handling post deleted event:", error);
  }
};
