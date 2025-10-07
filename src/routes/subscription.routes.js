import { Router } from "express";
import { 
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Toggle subscription (protected route)
router.route("/toggle/:channelId").post(verifyJWT, toggleSubscription);

// Get channel subscribers
router.route("/channel/:channelId").get(getUserChannelSubscribers);

// Get subscribed channels
router.route("/subscriber/:subscriberId").get(getSubscribedChannels);

export default router;
