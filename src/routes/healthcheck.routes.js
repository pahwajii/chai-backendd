import { Router } from "express";
import { healthCheck } from "../controllers/healthcheck.controller.js";

const router = Router();

// Health check route
router.route("/").get(healthCheck);

export default router;
