import { Router } from "express";
import {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getVideoRecommendations,
    getTrendingVideos,
    getRelatedVideos
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Get all videos with filtering and pagination
router.route("/").get(getAllVideos);

// Get trending videos
router.route("/trending").get(getTrendingVideos);

// Publish a new video (protected route)
router.route("/publish").post(
    verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount: 1,
        },
        {
            name: "thumbnail",
            maxCount: 1,
        }
    ]),
    publishAVideo
);

// Get video recommendations
router.route("/recommendations/:videoId").get(getVideoRecommendations);

// Get related videos
router.route("/related/:videoId").get(getRelatedVideos);

// Get video by ID (public route - no authentication required)
router.route("/:videoId").get(getVideoById);

// Update video (protected route)
router.route("/:videoId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateVideo
);

// Delete video (protected route)
router.route("/:videoId").delete(verifyJWT, deleteVideo);

// Toggle publish status (protected route)
router.route("/toggle/publish/:videoId").patch(verifyJWT, togglePublishStatus);

export default router;