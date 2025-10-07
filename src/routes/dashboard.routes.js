import { Router } from "express";
import { 
    getChannelStats,
    getChannelVideos
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get channel stats
router.route("/stats/:channelID").get(verifyJWT, getChannelStats);

// Get channel videos
router.route("/videos/:channelID").get(getChannelVideos);

export default router;
