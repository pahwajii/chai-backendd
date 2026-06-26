import { Router } from "express";
import {
    toggleVideoDislike,
    toggleCommentDislike,
    toggleTweetDislike,
    getDislikedVideos
} from "../controllers/dislike.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Toggle dislike on video (protected route)
router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoDislike);

// Toggle dislike on comment (protected route)
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentDislike);

// Toggle dislike on tweet (protected route)
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetDislike);

// Get disliked videos (protected route)
router.route("/disliked-videos").get(verifyJWT, getDislikedVideos);

export default router;