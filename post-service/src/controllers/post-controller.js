import logger from "../utils/logger.js";
import Post from "../models/Post.js";
import { publishEvent } from "../utils/rabbitmq.js";

async function invalidateCache(req, input) {
    const cachedKey = `post:${input}`; 
    await req.redisClient.del(cachedKey);
    const keys = await req.redisClient.keys("posts:*");
    if (keys.length > 0) {
        logger.info("Invalidating cache for posts");
        await req.redisClient.del(keys);
    }
    
}

export const createPost = async (req, res) => {
    logger.info("Creating post", req.body);
    try {
        const { content, mediaIds } = req.body;
        const newlyCreatedPost = new Post({
            user: req.user.userId,
            content,
            mediaIds: mediaIds || []
        });
        await newlyCreatedPost.save();
        await invalidateCache(req, newlyCreatedPost._id.toString());
        logger.info("Post created successfully", { postId: newlyCreatedPost._id, userId: req.user.userId });
        res.status(201).json({
            success: true,
            message: "Post created successfully",
            data: newlyCreatedPost
        });

    } catch (error) {
        logger.error("Error creating post", error );
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const getAllPosts = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;

        const cacheKey = `posts:${page}:${limit}`;
        const cachedPosts = await req.redisClient.get(cacheKey);

        if (cachedPosts) {
            return res.json(
                JSON.parse(cachedPosts)
            )
        }

        const posts = await Post.find({}).sort({ createdAt: -1 }).skip(startIndex).limit(limit)

        const totalPosts = await Post.countDocuments();
        
        const result = {
            posts,
            currentPage: page,
            totalPages: Math.ceil(totalPosts / limit),
            totalPosts: totalPosts
        };

        await req.redisClient.setex(cacheKey, 300, JSON.stringify(result));

        res.status(200).json({
            success: true,
            data: result
        });

    } catch (error) {
        logger.error("Error fetching posts", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const getPost = async (req, res) => {
    try {
        const postId = req.params.id;
        const cacheKey = `post:${postId}`;
        const cachedPost = await req.redisClient.get(cacheKey);
        if (cachedPost) {
            return res.json(
                JSON.parse(cachedPost)
            );
        }
        const postBtId = await Post.findById(postId)
        if (!postBtId) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }
        await req.redisClient.setex(cacheKey, 3600, JSON.stringify(postBtId));
        res.status(200).json({
            success: true,
            data: postBtId
        });
    } catch (error) {
        logger.error("Error fetching post", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

export const deletePost = async (req, res) => {
    try {
        const post = await Post.findByIdAndDelete({
            _id: req.params.id,
            user: req.user.userId
        })
        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found or you do not have permission to delete this post"
            });
        }
        // publish post delete method
        await publishEvent('post.deleted', {
            postId: post._id.toString(),
            userId: req.user.userId,
            mediaIds: post.mediaIds
        }); 


        await invalidateCache(req, req.params.id);
        logger.info("Post deleted successfully", { postId: post._id, userId: req.user.userId });
        res.status(200).json({
            success: true,
            message: "Post deleted successfully"
        });
    } catch (error) {
        logger.error("Error deleting post", error);
        res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
}

