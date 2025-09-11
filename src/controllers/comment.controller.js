import mongoose, { mongo } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const pipeline = [
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
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
            $addFields: {
                ownerName: "$owner.username",
                ownerAvatar: "$owner.avatar",
                ownerFullName: "$owner.fullName"
            }
        },
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
        },
        { $sort: { createdAt: -1 } }
    ];

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    };

    const comments = await Comment.aggregatePaginate(Comment.aggregate(pipeline), options);

    if (!comments.docs.length) {
        throw new ApiError(404, "No comments found for this video");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, "Video comments fetched successfully", comments));
});


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
    return res 
    .status(200)
    .json(new ApiResponse(200,"Comment added successfully",newComment))
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
        .json(new ApiResponse(200,comment,"comment updated succesfully"))
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

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }