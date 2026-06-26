import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {deleteFromCloudinary} from "../utils/deletefromcloudinary.js"
import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'


const getAllVideos = asyncHandler(async (req, res) => {
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
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "video",
                as: "dislikes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" }
            }
        },
        {
            $project: {                       // select fields to return
                title: 1,
                description: 1,
                views: 1,
                thumbnail: 1,
                duration: 1,
                isPublished: 1,
                createdAt: 1,
                likesCount: 1,
                dislikesCount: 1,
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
    const videoFileSize = req.files?.video?.[0]?.size;
    const thumbnailFileSize = req.files?.thumbnail?.[0]?.size;

    if (!videoLocalPath || !thumbnailLocalPath) {
        throw new ApiError(400, "Video and thumbnail are required");
    }

    // Check file sizes (100MB limit for video, 10MB for thumbnail)
    const maxVideoSize = 100 * 1024 * 1024; // 100MB
    const maxThumbnailSize = 10 * 1024 * 1024; // 10MB

    if (videoFileSize > maxVideoSize) {
        throw new ApiError(400, "Video file is too large. Maximum size is 100MB");
    }

    if (thumbnailFileSize > maxThumbnailSize) {
        throw new ApiError(400, "Thumbnail file is too large. Maximum size is 10MB");
    }

    console.log(`Video file size: ${(videoFileSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Thumbnail file size: ${(thumbnailFileSize / 1024 / 1024).toFixed(2)}MB`);

    // Upload to Cloudinary
    console.log('Starting video upload to Cloudinary...');
    const videoFile = await uploadOnCloudinary(videoLocalPath);
    console.log('Video upload result:', videoFile ? 'Success' : 'Failed');
    
    console.log('Starting thumbnail upload to Cloudinary...');
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    console.log('Thumbnail upload result:', thumbnail ? 'Success' : 'Failed');

    if (!videoFile || !thumbnail) {
        console.error('Upload failed - Video:', !!videoFile, 'Thumbnail:', !!thumbnail);
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

    console.log('Video created successfully:', video);
    console.log('Video owner:', video.owner);
    console.log('Request user ID:', req.user._id);

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video published successfully"));
});


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    console.log('getVideoById called with videoId:', videoId);

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Query video with owner info, subscriber count, and like/dislike counts
    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },
        {
            $lookup: {
                from: "subscriptions",
                localField: "owner._id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "video",
                as: "dislikes"
            }
        },
        {
            $addFields: {
                "owner.subscribersCount": { $size: "$subscribers" },
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" },
                isLikedByUser: req.user ? {
                    $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"]
                } : false,
                isDislikedByUser: req.user ? {
                    $in: [new mongoose.Types.ObjectId(req.user._id), "$dislikes.dislikedBy"]
                } : false
            }
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                views: 1,
                duration: 1,
                createdAt: 1,
                isPublished: 1,
                likesCount: 1,
                dislikesCount: 1,
                isLikedByUser: 1,
                isDislikedByUser: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                    subscribersCount: 1
                }
            }
        }
    ]);

    const videoData = video[0];

    console.log('Video found:', videoData ? videoData._id : 'null');
    console.log('Video owner:', videoData?.owner);
    console.log('Video owner username:', videoData?.owner?.username);

    if (!videoData) {
        throw new ApiError(404, "Video doesn't exist");
    }

    // IMPROVEMENT: Check if video is unpublished and requester is not the owner
    if (!videoData.isPublished && (!req.user || videoData.owner._id.toString() !== req.user._id.toString())) {
        throw new ApiError(403, "You are not allowed to view this video");
    }

    // Increment views - need to update the actual document
    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    // IMPROVEMENT: Add to watch history if user is logged in
    if (req.user) {
        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { watchHistory: videoData._id }
        });
    }

    // Return response
    return res
        .status(200)
        .json(new ApiResponse(200, videoData, "Video fetched successfully"));
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

const getVideoRecommendations = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Get the current video to understand its context
    const currentVideo = await Video.findById(videoId)
        .populate("owner", "username fullName avatar");

    if (!currentVideo) {
        throw new ApiError(404, "Video not found");
    }

    // Get user's watch history for personalized recommendations
    let userWatchHistory = [];
    if (req.user) {
        const user = await User.findById(req.user._id).select("watchHistory");
        userWatchHistory = user?.watchHistory || [];
    }

    // Build recommendation pipeline
    const pipeline = [
        // Match published videos only
        { $match: { isPublished: true, _id: { $ne: new mongoose.Types.ObjectId(videoId) } } },
        
        // Lookup owner information
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },

        // Add recommendation score based on multiple factors
        {
            $addFields: {
                recommendationScore: {
                    $add: [
                        // Score based on views (popularity)
                        { $multiply: [{ $log: [{ $add: ["$views", 1] }, 10] }, 0.3] },
                        
                        // Score based on recency (newer videos get higher score)
                        { $multiply: [{ $divide: [{ $subtract: [new Date(), "$createdAt"] }, 86400000] }, -0.1] },
                        
                        // Score based on same channel (if user likes this channel)
                        { $cond: [
                            { $eq: ["$owner._id", currentVideo.owner._id] },
                            2.0, // Higher score for same channel
                            0
                        ]},
                        
                        // Score based on user's watch history (if video is in history, lower score)
                        { $cond: [
                            { $in: ["$_id", userWatchHistory] },
                            -1.0, // Lower score for already watched videos
                            0
                        ]},
                        
                        // Score based on similar titles (basic keyword matching)
                        { $cond: [
                            { $regexMatch: { 
                                input: "$title", 
                                regex: new RegExp(currentVideo.title.split(' ').slice(0, 3).join('|'), 'i') 
                            }},
                            1.5, // Higher score for similar titles
                            0
                        ]}
                    ]
                }
            }
        },

        // Sort by recommendation score
        { $sort: { recommendationScore: -1 } },

        // Limit results
        { $limit: parseInt(limit) },

        // Lookup likes and dislikes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "video",
                as: "dislikes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" }
            }
        },
        // Project only necessary fields
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                likesCount: 1,
                dislikesCount: 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1
            }
        }
    ];

    const recommendations = await Video.aggregate(pipeline);

    return res
        .status(200)
        .json(new ApiResponse(200, recommendations, "Recommendations fetched successfully"));
});

const getTrendingVideos = asyncHandler(async (req, res) => {
    const { limit = 20, timeRange = "7d" } = req.query;

    // Calculate date range
    let startDate = new Date();
    switch (timeRange) {
        case "1d":
            startDate.setDate(startDate.getDate() - 1);
            break;
        case "7d":
            startDate.setDate(startDate.getDate() - 7);
            break;
        case "30d":
            startDate.setDate(startDate.getDate() - 30);
            break;
        default:
            startDate.setDate(startDate.getDate() - 7);
    }

    const pipeline = [
        // Match published videos within time range
        { 
            $match: { 
                isPublished: true,
                createdAt: { $gte: startDate }
            } 
        },
        
        // Lookup owner information
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },

        // Calculate trending score based on views and recency
        {
            $addFields: {
                trendingScore: {
                    $add: [
                        // Views score (logarithmic to prevent viral videos from dominating)
                        { $multiply: [{ $log: { $add: ["$views", 1] } }, 0.4] },
                        
                        // Recency score (newer videos get higher score)
                        { $multiply: [{ $divide: [{ $subtract: [new Date(), "$createdAt"] }, 86400000] }, -0.2] },
                        
                        // Engagement score (if we had likes/comments, we'd include them here)
                        { $multiply: ["$views", 0.001] }
                    ]
                }
            }
        },

        // Sort by trending score
        { $sort: { trendingScore: -1 } },

        // Limit results
        { $limit: parseInt(limit) },

        // Lookup likes and dislikes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "video",
                as: "dislikes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" }
            }
        },
        // Project only necessary fields
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                trendingScore: 1,
                likesCount: 1,
                dislikesCount: 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1
            }
        }
    ];

    const trendingVideos = await Video.aggregate(pipeline);

    return res
        .status(200)
        .json(new ApiResponse(200, trendingVideos, "Trending videos fetched successfully"));
});

const getRelatedVideos = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Get the current video
    const currentVideo = await Video.findById(videoId)
        .populate("owner", "username fullName avatar");

    if (!currentVideo) {
        throw new ApiError(404, "Video not found");
    }

    // Extract keywords from title and description
    const titleWords = currentVideo.title.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const descriptionWords = currentVideo.description.toLowerCase().split(/\s+/).filter(word => word.length > 3);
    const keywords = [...new Set([...titleWords, ...descriptionWords])];

    const pipeline = [
        // Match published videos (excluding current video)
        {
            $match: {
                isPublished: true,
                _id: { $ne: new mongoose.Types.ObjectId(videoId) }
            }
        },

        // Lookup owner information
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        { $unwind: "$owner" },

        // Add relevance score
        {
            $addFields: {
                relevanceScore: {
                    $add: [
                        // Score for same channel
                        { $cond: [
                            { $eq: ["$owner._id", currentVideo.owner._id] },
                            3.0, // High score for same channel
                            0
                        ]},

                        // Score for keyword matches in title
                        { $multiply: [
                            { $size: { $setIntersection: [
                                { $split: [{ $toLower: "$title" }, " "] },
                                keywords
                            ]}},
                            1.5
                        ]},

                        // Score for keyword matches in description
                        { $multiply: [
                            { $size: { $setIntersection: [
                                { $split: [{ $toLower: "$description" }, " "] },
                                keywords
                            ]}},
                            0.5
                        ]},

                        // Score based on views (popularity)
                        { $multiply: [{ $log: { $add: ["$views", 1] } }, 0.2] }
                    ]
                }
            }
        },

        // Sort by relevance score
        { $sort: { relevanceScore: -1 } },

        // Limit results
        { $limit: parseInt(limit) },

        // Lookup likes and dislikes
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $lookup: {
                from: "dislikes",
                localField: "_id",
                foreignField: "video",
                as: "dislikes"
            }
        },
        {
            $addFields: {
                likesCount: { $size: "$likes" },
                dislikesCount: { $size: "$dislikes" }
            }
        },
        // Project only necessary fields
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                duration: 1,
                views: 1,
                createdAt: 1,
                likesCount: 1,
                dislikesCount: 1,
                "owner.username": 1,
                "owner.fullName": 1,
                "owner.avatar": 1
            }
        }
    ];

    const relatedVideos = await Video.aggregate(pipeline);

    return res
        .status(200)
        .json(new ApiResponse(200, relatedVideos, "Related videos fetched successfully"));
});

const convertVideoToAudio = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate videoId
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Find the video
    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Check if video is published or if user is the owner
    if (!video.isPublished && (!req.user || video.owner.toString() !== req.user._id.toString())) {
        throw new ApiError(403, "You are not allowed to access this video");
    }

    // Get video URL from Cloudinary
    const videoUrl = video.videoFile.url;
    if (!videoUrl) {
        throw new ApiError(400, "Video file not available");
    }

    // Create temporary directory for processing
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const tempDir = path.join(__dirname, '../../temp');

    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    // Generate unique filename for audio output
    const audioFilename = `audio_${videoId}_${Date.now()}.mp3`;
    const audioPath = path.join(tempDir, audioFilename);

    try {
        // Convert video to audio using Python script
        const pythonScript = path.join(__dirname, '../../convert_video.py');

        console.log('Starting Python conversion process...');
        console.log('Python script path:', pythonScript);
        console.log('Video URL:', videoUrl);
        console.log('Audio output path:', audioPath);

        // First, check if the video URL is accessible
        try {
            const urlCheck = await fetch(videoUrl, { method: 'HEAD' });
            if (!urlCheck.ok) {
                throw new ApiError(400, `Video URL is not accessible (HTTP ${urlCheck.status})`);
            }
            console.log('Video URL is accessible');
        } catch (urlError) {
            console.error('Video URL check failed:', urlError.message);
            throw new ApiError(400, `Cannot access video URL: ${urlError.message}`);
        }

        await new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [pythonScript, videoUrl, audioPath], {
                stdio: ['pipe', 'pipe', 'pipe'],
                cwd: path.dirname(pythonScript) // Set working directory to script location
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
                console.log('Python stdout:', data.toString());
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
                console.log('Python stderr:', data.toString());
            });

            pythonProcess.on('close', (code) => {
                console.log('Python process exited with code:', code);
                if (code === 0) {
                    console.log('Python audio conversion completed successfully');
                    resolve();
                } else {
                    console.error('Python conversion failed with code:', code);
                    console.error('Stdout:', stdout);
                    console.error('Stderr:', stderr);
                    reject(new ApiError(500, `Audio conversion failed: ${stderr || 'Unknown error'}`));
                }
            });

            pythonProcess.on('error', (err) => {
                console.error('Failed to start Python process:', err);
                reject(new ApiError(500, `Audio conversion process failed: ${err.message}`));
            });
        });

        // Check if audio file was created
        if (!fs.existsSync(audioPath)) {
            throw new ApiError(500, 'Audio file was not created');
        }

        // Upload audio to Cloudinary
        const audioUpload = await uploadOnCloudinary(audioPath);
        if (!audioUpload) {
            throw new ApiError(500, 'Failed to upload audio file');
        }

        // Clean up temporary file
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }

        // Return the audio URL
        return res
            .status(200)
            .json(new ApiResponse(200, {
                audioUrl: audioUpload.secure_url,
                publicId: audioUpload.public_id,
                title: video.title,
                duration: video.duration
            }, "Video converted to audio successfully"));

    } catch (error) {
        // Clean up temporary file in case of error
        if (fs.existsSync(audioPath)) {
            fs.unlinkSync(audioPath);
        }
        throw error;
    }
});

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getVideoRecommendations,
    getTrendingVideos,
    getRelatedVideos,
    convertVideoToAudio
}