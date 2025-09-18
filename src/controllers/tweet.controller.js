import mongoose, { isValidObjectId } from "mongoose"
import { Tweet } from "../models/tweet.model.js"
import { User } from "../models/user.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

// ================== CREATE ==================
const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    /**
    Get content from request body → const { content } = req.body;
    Validate → if content is empty, throw an error.
    Use logged-in user → req.user._id as owner.
    Create new document → Tweet.create({ content, owner }).
    Handle failure → if creation fails, throw error.
    Send response → res.status(201).json(new ApiResponse(...)).
    */
    const { content } = req.body
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required")
    }

    const owner = req.user?._id
    if (!owner) {
        throw new ApiError(401, "Unauthorized request")
    }

    const tweet = await Tweet.create({
        content: content.trim(), // improvement: always store trimmed content
        owner
    })

    if (!tweet) {
        throw new ApiError(500, "Tweet not created") // improvement: proper server error code
    }

    return res
        .status(201)
        .json(new ApiResponse(201, tweet, "Tweet created successfully"))
})

// ================== GET USER TWEETS ==================
const getUserTweets = asyncHandler(async (req, res) => {
    /*
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit)); 
    */
    // TODO: get user tweets
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query // improvement: added pagination

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing")
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() })
    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const tweets = await Tweet.find({ owner: user._id })
        .sort({ createdAt: -1 }) // newest first
        .skip((page - 1) * limit) // improvement: pagination
        .limit(Number(limit))     // improvement: pagination

    const totalTweets = await Tweet.countDocuments({ owner: user._id }) // improvement: total count

    return res
        .status(200)
        .json(new ApiResponse(200, {
            tweets,
            currentPage: Number(page),
            totalPages: Math.ceil(totalTweets / limit),
            totalTweets
        }, "User tweets fetched successfully"));
})

// ================== UPDATE ==================
const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetID } = req.params

    if (!isValidObjectId(tweetID)) {
        throw new ApiError(400, "tweetId is invalid")
    }

    const { content } = req.body
    if (!content?.trim()) {
        throw new ApiError(400, "content required")
    }

    const tweet = await Tweet.findById(tweetID)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    tweet.content = content.trim() // improvement: ensure trimmed update
    await tweet.save()

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "Tweet updated successfully"))
})

// ================== DELETE ==================
const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetID } = req.params

    if (!isValidObjectId(tweetID)) {
        throw new ApiError(400, "tweetId is invalid")
    }

    const tweet = await Tweet.findById(tweetID)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet")
    }

    await tweet.deleteOne() // improvement: directly delete fetched doc

    return res
        .status(200)
        .json(new ApiResponse(200, { id: tweet._id }, "Tweet deleted successfully")) // improvement: return only ID
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
