import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Dislike} from "../models/dislike.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video

    //validate videoid
    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid videoID")
    }

    //ensure video exist
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(400,"invalid VideoID")
    }
    //check if user already liked video
    const existinglike = await Like.findOne({
        video :videoId,
        likedBy:req.user._id
    })

    let message = ""
    if(existinglike){
        await Like.findByIdAndDelete(existinglike._id)
        message = "Video unliked successfully"
    }
    else{
        await Like.create({
            video :videoId,
            likedBy:req.user._id
        })
        
        // Remove dislike if it exists (mutual exclusivity)
        const existingDislike = await Dislike.findOne({
            video: videoId,
            dislikedBy: req.user._id
        })
        if(existingDislike){
            await Dislike.findByIdAndDelete(existingDislike._id)
        }
        
        message = "Video liked successfully"
    }

    const totalLikes = await Like.countDocuments({ video: videoId })
    const totalDislikes = await Dislike.countDocuments({ video: videoId })

    res.status(200).json(new ApiResponse(200,{
        totalLikes,
        totalDislikes
    },message))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
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

    // 3. Check if user already liked this comment
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    let message = ""
    if (existingLike) {
        // 4a. If like exists → unlike
        await Like.findByIdAndDelete(existingLike._id)
        message = "Comment unliked successfully"
    } else {
        // 4b. If like doesn't exist → like
        await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        
        // Remove dislike if it exists (mutual exclusivity)
        const existingDislike = await Dislike.findOne({
            comment: commentId,
            dislikedBy: req.user._id
        })
        if(existingDislike){
            await Dislike.findByIdAndDelete(existingDislike._id)
        }
        
        message = "Comment liked successfully"
    }

    // 5. Count total likes and dislikes for this comment
    const totalLikes = await Like.countDocuments({ comment: commentId })
    const totalDislikes = await Dislike.countDocuments({ comment: commentId })

    // 6. Send response
    return res.status(200).json(
        new ApiResponse(200, {
            totalLikes,
            totalDislikes
        }, message)
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {

    const { tweetId } = req.params

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweetId")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    let message = ""
    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        message = "Tweet unliked successfully"
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        
        // Remove dislike if it exists (mutual exclusivity)
        const existingDislike = await Dislike.findOne({
            tweet: tweetId,
            dislikedBy: req.user._id
        })
        if(existingDislike){
            await Dislike.findByIdAndDelete(existingDislike._id)
        }
        
        message = "Tweet liked successfully"
    }

    const totalLikes = await Like.countDocuments({ tweet: tweetId })
    const totalDislikes = await Dislike.countDocuments({ tweet: tweetId })

    res.status(200).json(new ApiResponse(200, {
        totalLikes,
        totalDislikes
    }, message))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    console.log('getLikedVideos called for user:', req.user._id);

    const likedVideos = await Like.find({
        likedBy:req.user._id,
        video:{$ne:null}
        /* video → the field in your Like schema that stores the reference to a Video document.
        $ne → MongoDB operator meaning "not equal to".
        null → literal null value.*/
    })
    .populate({
        path: "video",
        select: "title thumbnail duration views createdAt",
        populate: {
        path: "owner",
        select: "username fullName"
    }
    })
    .sort({ createdAt: -1 }); // Most recent likes first

    console.log('Raw liked videos count:', likedVideos.length);

    // Filter out any null videos and ensure uniqueness
    const uniqueLikedVideos = [];
    const seenVideoIds = new Set();

    for (const like of likedVideos) {
        if (like.video && like.video._id && !seenVideoIds.has(like.video._id.toString())) {
            seenVideoIds.add(like.video._id.toString());
            uniqueLikedVideos.push(like);
        }
    }

    console.log('Unique liked videos count:', uniqueLikedVideos.length);

    res.status(200).json(new ApiResponse(200, uniqueLikedVideos))
})

const getTweetLikesCountByUsers = asyncHandler(async (req, res) => {
    const likesCount = await Like.aggregate([
        { $match: { tweet: { $ne: null } } },
        { $group: { _id: "$likedBy", count: { $sum: 1 } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: "$user" },
        { $project: { _id: 0, user: { username: 1, fullName: 1 }, count: 1 } }
    ]);

    res.status(200).json(new ApiResponse(200, likesCount, "Tweet likes count by users fetched successfully"));
});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getTweetLikesCountByUsers
}