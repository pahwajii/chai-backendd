
import { Router } from "express";
import {
    getVideoComments,
    getTweetComments,
    addComment,
    addTweetComment,
    updateComment,
    deleteComment
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Get comments for a video (paginated)
router.get("/:videoId", getVideoComments);

// ✅ Add a new comment to video (protected route)
router.post("/:videoId", verifyJWT, addComment);

// ✅ Get comments for a tweet (paginated)
router.get("/tweet/:tweetId", getTweetComments);

// ✅ Add a new comment to tweet (protected route)
router.post("/tweet/:tweetId", verifyJWT, addTweetComment);

// ✅ Update a comment (protected route)
router.put("/:commentID", verifyJWT, updateComment);

// ✅ Delete a comment (protected route)
router.delete("/:commentID", verifyJWT, deleteComment);

export default router;

/**
 * If you want to make it feel even more REST-like, you could nest routes like this:
 // comment.routes.js
router
  .route("/video/:videoId")
  .get(getVideoComments)          // GET comments for a video
  .post(verifyJWT, addComment);   // Add comment to a video

router
  .route("/:commentID")
  .put(verifyJWT, updateComment)   // Update a comment
  .delete(verifyJWT, deleteComment); // Delete a comment

 */


