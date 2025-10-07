 import mongoose, { mongo } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate video ID
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    // Build aggregation pipeline
    const pipeline = [
        {
            // Match comments for the given video
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            // Lookup comment owner details from users collection
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, avatar: 1, fullName: 1 } } // only select needed fields
                ]
            }
        },
        { 
            // Flatten the owner array to a single object
            $unwind: "$owner" 
        },
        {
            // Add convenient fields for frontend
            $addFields: {
                ownerName: "$owner.username",
                ownerAvatar: "$owner.avatar",
                ownerFullName: "$owner.fullName"
            }
        },
        {
            // Project the final structure of each comment
            $project: {
                content: 1,
                video: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar",
                    fullName: "$owner.fullName"
                },
                createdAt: 1
            }
        },
        { 
            // Sort comments by newest first
            $sort: { createdAt: -1 } 
        }
    ];

    // Pagination options
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    // Execute paginated aggregation
    const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

    // If no comments found, return 404
    if (!comments.docs.length) {
        throw new ApiError(404, "No comments found for this video");
    }

    // Send success response with paginated comments
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Video comments fetched successfully"));
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    if(!content){
        throw new ApiError(400,"Comment content is required")
    }
    const newComment = await Comment.create({
        content,
        video:videoId,
        owner:req.user._id
    })

    if(!newComment){
        throw new ApiError(500,"Failed to add comment")
    }

    // Populate the comment with owner details using aggregation pipeline
    const populatedComment = await Comment.aggregate([
        {
            $match: { _id: newComment._id }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, avatar: 1, fullName: 1 } }
                ]
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                content: 1,
                video: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar",
                    fullName: "$owner.fullName"
                },
                createdAt: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, populatedComment[0], "Comment added successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
/**
    Get the comment ID from the request.
    Validate that the ID is a proper MongoDB ObjectId.
    Fetch the comment from the database using that ID.
    If no comment is found → return an error (comment not found).
    Check if the logged-in user is the owner of the comment.
    If not the owner → return an error (not authorized).
    If yes → take the new content from the request body.
    Validate the new content (not empty, proper format).
    Update the comment’s content in the database.
    Return a success response with the updated comment.
 */
    const {commentID} = req.params

    if(!mongoose.Types.ObjectId.isValid(commentID)){
        throw new ApiError(400,"commentId is invalid")
    }
    const {content}= req.body
    
        if (!content) {
            throw new ApiError(400, "content required")
        }
    
        const comment = await Comment.findByIdAndUpdate(
            commentID,
            {
                $set:{
                    content:content
                }
            },
            {new : true }
        )
    
        return res
    .status(200)
    .json(new ApiResponse(200, comment, "comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    /*
    Extract commentID from req.params.
    Validate that commentID is a valid MongoDB ObjectId.
    Check if the comment actually exists in the database.
    (Optional but recommended) Verify ownership → make sure the logged-in user is the owner of the comment before deleting.
    Delete the comment from the database (using findByIdAndDelete or similar).
    Send response with success message and maybe return the deleted comment if needed
    */
    const { commentID } = req.params

    if (!mongoose.Types.ObjectId.isValid(commentID)) {
        throw new ApiError(400, "commentId is invalid")
    }

    const comment = await Comment.findById(commentID)
    if (!comment) {
        throw new ApiError(404, "comment not found")
    }

    // Ownership check
    if (comment.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this comment")
    }

    await Comment.findByIdAndDelete(commentID)

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "comment deleted successfully"))
})

const getTweetComments = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Validate tweet ID
    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    // Build aggregation pipeline
    const pipeline = [
        {
            // Match comments for the given tweet
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            // Lookup comment owner details from users collection
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, avatar: 1, fullName: 1 } } // only select needed fields
                ]
            }
        },
        { $unwind: "$owner" },
        {
            // Add convenient fields for frontend
            $addFields: {
                ownerName: "$owner.username",
                ownerAvatar: "$owner.avatar",
                ownerFullName: "$owner.fullName"
            }
        },
        {
            // Project the final structure of each comment
            $project: {
                content: 1,
                tweet: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar",
                    fullName: "$owner.fullName"
                },
                createdAt: 1
            }
        },
        { $sort: { createdAt: -1 } }
    ];

    // Pagination options
    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    // Execute paginated aggregation
    const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

    // If no comments found, return 404
    if (!comments.docs.length) {
        throw new ApiError(404, "No comments found for this tweet");
    }

    // Send success response with paginated comments
    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Tweet comments fetched successfully"));
});

const addTweetComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a tweet
    const { tweetId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }
    if(!content){
        throw new ApiError(400,"Comment content is required")
    }

    // Check if tweet exists
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    const newComment = await Comment.create({
        content,
        tweet: tweetId,
        owner: req.user._id
    });

    if(!newComment){
        throw new ApiError(500,"Failed to add comment")
    }

    // Populate the comment with owner details using aggregation pipeline
    const populatedComment = await Comment.aggregate([
        {
            $match: { _id: newComment._id }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { $project: { username: 1, avatar: 1, fullName: 1 } }
                ]
            }
        },
        { $unwind: "$owner" },
        {
            $project: {
                content: 1,
                tweet: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar",
                    fullName: "$owner.fullName"
                },
                createdAt: 1
            }
        }
    ]);

    return res
    .status(200)
    .json(new ApiResponse(200, populatedComment[0], "Comment added successfully"))
});

export {
    getVideoComments,
    getTweetComments,
    addComment,
    addTweetComment,
    updateComment,
    deleteComment
    }