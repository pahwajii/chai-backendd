import { Router } from "express";
import {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos,
    getTweetLikesCountByUsers
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Toggle like on video (protected route)
router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);

// Toggle like on comment (protected route)
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);

// Toggle like on tweet (protected route)
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);

// Get liked videos (protected route)
router.route("/liked-videos").get(verifyJWT, getLikedVideos);

// Get tweet likes count by users
router.route("/tweet-likes-count").get(getTweetLikesCountByUsers);

export default router;
