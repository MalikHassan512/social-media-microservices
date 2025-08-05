import express from 'express';
import {
    createPost,
    getAllPosts,
    getPost,
    deletePost
} from '../controllers/post-controller.js';
import { authenticateRequest } from '../middleware/authMiddleware.js';

const router = express();

router.use(authenticateRequest);

router.post('/create-post', createPost);
router.get('/all-posts', getAllPosts);
router.get('/:id', getPost);
router.delete('/:id', deletePost);


export default router;