import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


export const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, userId, sortBy = "createdAt", sortType = "desc" } = req.query;

    let match = {};

    // Search filter: title or description (case insensitive)
    if (query) {
        match.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { $regex: query, $options: "i" } }
        ];
    }

    // Filter by user (Video.owner must match User._id)
      if (userId) {
        if (!isValidObjectId(userId)) {
            throw new ApiError(400, "Invalid userId");
        }
        match.owner = new mongoose.Types.ObjectId(userId);
    }


    // Show only published videos
    match.isPublished = true;

     // Sorting: default by createdAt descending

    const sortOptions = {};
    sortOptions[sortBy] = sortType.toLowerCase() === "asc" ? 1 : -1;

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const aggregate = Video.aggregate([
        { $match: match },
        {
            $lookup: {
                from: "users",            // collection name in MongoDB
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },                // convert array to object
        {
            $project: {                       // select fields to return
                title: 1,
                description: 1,
                views: 1,
                thumbnail: 1,
                duration: 1,
                isPublished: 1,
                createdAt: 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1
            }
        }
    ]);

    const videos = await Video.aggregatePaginate(aggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    // Validation
    if ([title, description].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Get uploaded file paths
    const videoLocalPath = req.files?.video?.[0]?.path;
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail are required");
    }

    // Upload to Cloudinary
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if (!videoFile || !thumbnail) {
        throw new ApiError(400, "Failed to upload video/thumbnail");
    }

    // Create video document
    const video = await Video.create({
        title,
        description,
        videoFile: {
            url: videoFile.secure_url,
            publicId: videoFile.public_id
        },
        thumbnail: {
            url: thumbnail.secure_url,
            publicId: thumbnail.public_id
        },
        duration: videoFile.duration,       // Cloudinary provides this
        owner: req.user._id,                // logged-in user from auth middleware
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});





const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Query video and populate owner info
    const video = await Video.findById(videoId)
        .populate("owner", "username avatar fullName")
        .select("title description thumbnail views duration createdAt owner isPublished"); // added isPublished for improved check

    if (!video) {
        throw new ApiError(404, "Video doesn't exist");
    }

    // IMPROVEMENT: Check if video is unpublished and requester is not the owner
    if (!video.isPublished && (!req.user || video.owner._id.toString() !== req.user._id.toString())) {
        throw new ApiError(403, "You are not allowed to view this video");
    }

    // Increment views
    video.views = video.views + 1;
    await video.save();

    // IMPROVEMENT: Add to watch history if user is logged in
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: video._id }
        });
    }

    // Return response
    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video fetched successfully"));
});



const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const { title, description } = req.body;
    const thumbnailFile = req.files?.thumbnail?.[0]?.path;

    if (!title) throw new ApiError(400, "Title is required");
    if (!description) throw new ApiError(400, "Description is required");
    if (!thumbnailFile && !req.body.thumbnail) throw new ApiError(400, "Thumbnail is required");

    // IMPROVEMENT: handle thumbnail upload
    let thumbnailData = {};
    if (thumbnailFile) {
        const uploadedThumbnail = await uploadOnCloudinary(thumbnailFile);
        thumbnailData = {
            url: uploadedThumbnail.secure_url,
            publicId: uploadedThumbnail.public_id
        };
    } else if (req.body.thumbnail) {
        thumbnailData = req.body.thumbnail;
    }

    // IMPROVEMENT: Find video first to check ownership
    const videoCheck = await Video.findById(videoId);
    if (!videoCheck) throw new ApiError(404, "Video not found");
    if (videoCheck.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    // Update using findByIdAndUpdate
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,                   // fixed typo
                description: description,
                thumbnail: thumbnailData
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});





const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "videoId is invalid");
    }

    // Find video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Ownership check - only owner can delete
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // IMPROVEMENT: Delete video file and thumbnail from Cloudinary
    if (video.videoFile?.publicId) {
        await deleteFromCloudinary(video.videoFile.publicId);
    }
    if (video.thumbnail?.publicId) {
        await deleteFromCloudinary(video.thumbnail.publicId);
    }

    // IMPROVEMENT: Remove this video from all users' watchHistory
    await User.updateMany(
        { watchHistory: video._id },
        { $pull: { watchHistory: video._id } }
    );

    // Delete video document from DB
    await Video.findByIdAndDelete(videoId);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});



const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "videoId is invalid");
    }

    //fetch video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    //ownership check 
    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to publish or unpublish this video");
    }

    //published toggle update
    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true }
    );

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                updatedVideo,
                `Video is now ${updatedVideo.isPublished ? "published" : "unpublished"}` // IMPROVEMENT: dynamic message
            )
        );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}