import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { use } from "react"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name){
        throw new ApiError(400,"playlist name is required ")
    }
    const ownerId = req.user._id;

    if(!mongoose.Types.ObjectId.isValid(ownerId)){
        throw new ApiError(400 , "invalid owner")
    }

    const playlist = await Playlist.create({
        name : name ,
        description : description,
        owner : ownerId
    })

    return res
    .status(201)
    .json(new ApiResponse(201,playlist,"playlist created"))

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    // Fetch all playlists created by a particular user (usually the logged-in user). You can also support optional pagination and sorting if you want.
    if(!mongoose.Types.ObjectId.isValid(userId)){
        throw new ApiError(400 , "invalid user")
    }

    // Fetch playlists for the given user, sorted newest first, and populate owner details
    const playlists = await Playlist.find({ owner: userId })
        .sort({ createdAt: -1 })
        .populate("owner", "name email"); // correctly populate owner fields


    return res
    .status(200)
    .json(new ApiResponse(200,playlists,"playlists fetched"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    
    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"invalid playlistId")
    }

    const playlist = await Playlist.findById(playlistId)
    .populate("owner","name email")
    .populate({
        path:"videos",
        select:"title description duration createdAt owner",
        populate:{path:"owner",select:"name email"}
    })

    if(!playlist){
        throw new ApiError(400,"playlist doesnt exist")
    }
    //checking the user requesting owns the playlist or not
    // Step 4: Handle private playlists
    if (!playlist.isPublic) {
        const requesterId = req.user?._id?.toString();
        const ownerId = playlist.owner?._id?.toString();
        const isOwner = requesterId && ownerId && requesterId === ownerId;
        

        if (!isOwner) {
            throw new ApiError(403, "You are not authorized to access this playlist");
        }
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"playlist fetched succesfully"))

})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params

    // Step 1: Get IDs
    // Fetch playlistId from req.params.
    // Fetch videoId from req.body.
    // Validate both IDs with mongoose.Types.ObjectId.isValid.
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invalid playlistId")
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid videoId")
    }

    // Step 2: Fetch playlist
    // Remember to await, otherwise you get a Promise
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    // Step 3: Authorization check
    // Only the owner of the playlist can add videos
    if (!req.user || playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to access this playlist")
    }

    // Step 4: Check if video exists
    // Await is required here too
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not found")
    }

    // Step 5: Add video to playlist using $addToSet
    // This prevents duplicates
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { videos: videoId } }, // correct field name 'videos'
        { new: true } // return updated document
    )
    .populate("owner", "name email") // populate owner info
    .populate({
        path: "videos",
        select: "title description duration owner",
        populate: { path: "owner", select: "name email" }
    })

    // Step 6: Return response
    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params
    // TODO: remove video from playlist

    // Step 1: Validate IDs
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invalid playlistId")
    }
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "invalid videoId")
    }

    // Step 2: Fetch playlist
    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    // Step 3: Authorization check
    if (!req.user || playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to access this playlist")
    }

    // Step 4: Check if video exists
    const video = await Video.findById(videoId)
    if (!video) {
        throw new ApiError(404, "video not found")
    }

    // Step 5: Remove video using $pull and return updated playlist with populate
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $pull: { videos: videoId } },
        { new: true }
    )
    .populate("owner", "name email")
    .populate({
        path: "videos",
        select: "title description duration owner",
        populate: { path: "owner", select: "name email" }
    })

    // Step 6: Return response
    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully"))
})



const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    // Step 1: Validate playlistId
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invalid playlistId")
    }

    // Step 2: Fetch playlist (populate owner info if needed)
    const playlist = await Playlist.findById(playlistId).populate("owner", "name email")
    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    // Step 3: Authorization check
    if (!req.user || playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to access this playlist")
    }

    // Step 4: Delete playlist
    await Playlist.findByIdAndDelete(playlistId)

    // Step 5: Return response
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfully"))
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    const { name, description, isPublic } = req.body
    // TODO: update playlist

    // Step 1: Validate playlistId
    if (!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError(400, "invalid playlistId")
    }

    // Step 2: Validate name (required)
    if (!name) {
        throw new ApiError(400, "name is required")
    }

    // Step 3: Fetch playlist (populate owner info if needed)
    const playlist = await Playlist.findById(playlistId).populate("owner", "name email")
    if (!playlist) {
        throw new ApiError(404, "playlist not found")
    }

    // Step 4: Authorization check
    if (!req.user || playlist.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not authorized to access this playlist")
    }

 

    // Step 5: Update playlist and return the updated document
    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
        name,
        description,
        ...(isPublic !== undefined && { isPublic })
        },
        { new: true }
    )
    .populate("owner", "name email")
    .populate({
        path: "videos",
        select: "title description duration owner",
        populate: { path: "owner", select: "name email" }
    })

    // Step 6: Return response
    return res.status(200).json(new ApiResponse(200, updatedPlaylist, "Playlist updated successfully"))
})


export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}

/* 
==================== NOTES & POINTS TO REMEMBER – PLAYLIST CONTROLLER ====================

1️⃣ Common Mistakes:
- Authorization was checked before fetching the playlist → always fetch first, then check ownership.
- Used findByIdAndUpdate without passing update object and { new: true } → must always include both.
- Missing 'await' on Mongoose queries → results in unresolved Promise instead of document.
- Incorrect populate syntax (e.g., .populate({ name, description })) → must use path and select.
- Validation logic reversed for ObjectId (used if(isValid) instead of if(!isValid)).
- Unused imports like `import { use } from "react"` in backend.

2️⃣ Key Points to Remember:
- Always validate IDs using mongoose.Types.ObjectId.isValid before querying.
- Authorization: only playlist owner can modify (add/remove/update/delete).
- For private playlists, verify ownership before allowing access.
- CRUD Operations:
    • Create → Playlist.create
    • Read → findById / find
    • Update → findByIdAndUpdate(id, updateObject, { new: true })
    • Delete → findByIdAndDelete
- Array Operations:
    • $addToSet → add video without duplicates
    • $pull → remove video from array
- Populate Usage:
    • populate("owner", "name email") → include only required fields
    • Nested populate for videos’ owner:
      .populate({ path: "videos", select: "title description owner", populate: { path: "owner", select: "name email" } })
- Response Consistency:
    • Use ApiResponse(statusCode, data, message)
    • HTTP status codes: 200 → success, 201 → created, 400 → bad request, 403 → forbidden, 404 → not found
- Optional Improvements:
    • Allow partial updates in updatePlaylist (update only fields provided)
    • Check for existence before adding/removing videos to give descriptive messages
    • Keep clear comments for readability

==========================================================================================
*/
