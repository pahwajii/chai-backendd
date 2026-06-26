import { Router } from "express";
import { 
    getChannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get channel stats
router.route("/stats/:channelId").get(verifyJWT, getChannelStats);

// Get channel videos
router.route("/videos/:channelId").get(getChannelVideos);

export default router;
