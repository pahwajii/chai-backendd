import { Router } from "express";
import { 
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Create playlist (protected route)
router.route("/").post(verifyJWT, createPlaylist);

// Get user playlists
router.route("/user/:userId").get(getUserPlaylists);

// Get playlist by ID
router.route("/:playlistId").get(getPlaylistById);

// Update playlist (protected route)
router.route("/:playlistId").patch(verifyJWT, updatePlaylist);

// Delete playlist (protected route)
router.route("/:playlistId").delete(verifyJWT, deletePlaylist);

// Add video to playlist (protected route)
router.route("/:playlistId/video/:videoId").post(verifyJWT, addVideoToPlaylist);

// Remove video from playlist (protected route)
router.route("/:playlistId/video/:videoId").delete(verifyJWT, removeVideoFromPlaylist);

export default router;
