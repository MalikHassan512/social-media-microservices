import Search from "../models/Search.js";
import logger from "../utils/logger.js";

export async function handlePostCreatedEvent(eventData) {
  try {
    const newSearchPost = new Search({
      postId: eventData.postId,
      userId: eventData.userId,
      content: eventData.content,
      createdAt: eventData.createdAt,
    });
    await newSearchPost.save();
    logger.info("Search post created event handled successfully", {
      postId: eventData.postId,
    });
  } catch (error) {
    logger.error("Error handling search.post.created event:", error);
  }
}

export async function handlePostDeletedEvent(eventData) {
  console.log("Handling search.post.deleted event:", eventData);
  try {
    await Search.findOneAndDelete({ postId: eventData.postId });
    logger.info("Search post deleted event handled successfully", {
      postId: eventData.postId,
    });
  } catch (error) {
    logger.error("Error handling search.post.deleted event:", error);
  }
}
