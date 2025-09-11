
import { Router } from "express";
import { 
    getVideoComments, 
    addComment, 
    updateComment, 
    deleteComment 
} from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// ✅ Get comments for a video (paginated)
router.get("/:videoId", getVideoComments);

// ✅ Add a new comment (protected route)
router.post("/:videoId", verifyJWT, addComment);

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


