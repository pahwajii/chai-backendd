import { Router } from "express";
import {
    createTweet,
    getUserTweets,
    getAllTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get all tweets (public route)
router.route("/all").get(getAllTweets);

// Create tweet (protected route)
router.route("/").post(verifyJWT, createTweet);

// Get user tweets
router.route("/user/:username").get(getUserTweets);

// Update tweet (protected route)
router.route("/:tweetID").patch(verifyJWT, updateTweet);

// Delete tweet (protected route)
router.route("/:tweetID").delete(verifyJWT, deleteTweet);

export default router;
