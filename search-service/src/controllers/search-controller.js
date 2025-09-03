import logger from "../utils/logger.js";
import Search from "../models/Search.js";

const searchPostController = async (req, res) => {
  logger.info("Searching for posts");
  try {
    const { query } = req.query;
    const cacheKey = `search:posts:${query}`;
    // Try to get from Redis cache first
    const cached = await req.redisClient.get(cacheKey);
    if (cached) {
      logger.info("Cache hit for search query", { query });
      return res.status(200).json({
        success: true,
        data: JSON.parse(cached),
        cached: true,
      });
    }

    // Not in cache, query MongoDB
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    // Store in Redis cache for 5 minutes
    await req.redisClient.set(cacheKey, JSON.stringify(results), "EX", 300);
    logger.info("Cache set for search query", { query });

    res.status(200).json({
      success: true,
      data: results,
      cached: false,
    });
  } catch (error) {
    logger.error("Error searching for posts:", error);
    res
      .status(500)
      .json({ success: false, message: "Error searching for posts" });
  }
};

export default searchPostController;
