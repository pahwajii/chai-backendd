import mongoose, {isValidObjectId} from "mongoose"
import {Dislike} from "../models/dislike.model.js"
import {Like} from "../models/like.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"

const toggleVideoDislike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    //validate videoid
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid videoID")
    }

    //ensure video exist
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"invalid VideoID")
    }

    //check if user already disliked video
    const existingDislike = await Dislike.findOne({
        video: videoId,
        dislikedBy: req.user._id
    })

    let message = ""
    if(existingDislike){
        // Remove dislike
        await Dislike.findByIdAndDelete(existingDislike._id)
        message = "Video undisliked successfully"
    }
    else{
        // Add dislike and remove any existing like
        await Dislike.create({
            video: videoId,
            dislikedBy: req.user._id
        })
        
        // Remove like if it exists (mutual exclusivity)
        const existingLike = await Like.findOne({
            video: videoId,
            likedBy: req.user._id
        })
        if(existingLike){
            await Like.findByIdAndDelete(existingLike._id)
        }
        
        message = "Video disliked successfully"
    }

    const totalDislikes = await Dislike.countDocuments({ video: videoId })
    const totalLikes = await Like.countDocuments({ video: videoId })

    res.status(200).json(new ApiResponse(200, {
        totalDislikes,
        totalLikes
    }, message))
})

const toggleCommentDislike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    // 1. Validate commentId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    // 2. Ensure comment exists
    const comment = await Comment.findById(commentId)
    if (!comment) {
        throw new ApiError(404, "Comment not found")
    }

    // 3. Check if user already disliked this comment
    const existingDislike = await Dislike.findOne({
        comment: commentId,
        dislikedBy: req.user._id
    })

    let message = ""
    if (existingDislike) {
        // 4a. If dislike exists → remove dislike
        await Dislike.findByIdAndDelete(existingDislike._id)
        message = "Comment undisliked successfully"
    } else {
        // 4b. If dislike doesn't exist → add dislike and remove like if exists
        await Dislike.create({
            comment: commentId,
            dislikedBy: req.user._id
        })
        
        // Remove like if it exists (mutual exclusivity)
        const existingLike = await Like.findOne({
            comment: commentId,
            likedBy: req.user._id
        })
        if(existingLike){
            await Like.findByIdAndDelete(existingLike._id)
        }
        
        message = "Comment disliked successfully"
    }

    // 5. Count total dislikes and likes for this comment
    const totalDislikes = await Dislike.countDocuments({ comment: commentId })
    const totalLikes = await Like.countDocuments({ comment: commentId })

    // 6. Send response
    return res.status(200).json(
        new ApiResponse(200, { 
            totalDislikes,
            totalLikes 
        }, message)
    )
})

const toggleTweetDislike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const existingDislike = await Dislike.findOne({
        tweet: tweetId,
        dislikedBy: req.user._id
    })

    let message = ""
    if (existingDislike) {
        await Dislike.findByIdAndDelete(existingDislike._id)
        message = "Tweet undisliked successfully"
    } else {
        await Dislike.create({
            tweet: tweetId,
            dislikedBy: req.user._id
        })
        
        // Remove like if it exists (mutual exclusivity)
        const existingLike = await Like.findOne({
            tweet: tweetId,
            likedBy: req.user._id
        })
        if(existingLike){
            await Like.findByIdAndDelete(existingLike._id)
        }
        
        message = "Tweet disliked successfully"
    }

    const totalDislikes = await Dislike.countDocuments({ tweet: tweetId })
    const totalLikes = await Like.countDocuments({ tweet: tweetId })

    res.status(200).json(new ApiResponse(200, {
        totalDislikes,
        totalLikes
    }, message))
})

const getDislikedVideos = asyncHandler(async (req, res) => {
    console.log('getDislikedVideos called for user:', req.user._id);

    const dislikedVideos = await Dislike.find({
        dislikedBy: req.user._id,
        video: {$ne: null}
    })
    .populate({
        path: "video",
        select: "title thumbnail duration views createdAt",
        populate: {
            path: "owner",
            select: "username fullName"
        }
    })
    .sort({ createdAt: -1 }); // Most recent dislikes first

    console.log('Raw disliked videos count:', dislikedVideos.length);

    // Filter out any null videos and ensure uniqueness
    const uniqueDislikedVideos = [];
    const seenVideoIds = new Set();

    for (const dislike of dislikedVideos) {
        if (dislike.video && dislike.video._id && !seenVideoIds.has(dislike.video._id.toString())) {
            seenVideoIds.add(dislike.video._id.toString());
            uniqueDislikedVideos.push(dislike);
        }
    }

    console.log('Unique disliked videos count:', uniqueDislikedVideos.length);

    res.status(200).json(new ApiResponse(200, uniqueDislikedVideos))
})

export {
    toggleVideoDislike,
    toggleCommentDislike,
    toggleTweetDislike,
    getDislikedVideos
}