import mongoose from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

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
    const {content} = req.body
    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required");
    }

    const owner = req.user?._id;
    if (!owner) {
    throw new ApiError(401, "Unauthorized request");
    }

    const tweet = await Tweet.create({
        content,
        owner
    })

    if(!tweet){
        throw new ApiError(401,"tweet not created")
    }

    return res
    .status(201)
    .json(new ApiResponse(201,tweet,"tweet created successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    /*
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const tweets = await Tweet.find({ owner: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit)); */
    // TODO: get user tweets
    const { username } = req.params;

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tweets = await Tweet.find({ owner: user._id })
        .sort({ createdAt: -1 }); // newest first

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});


const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tweetID)) {
        throw new ApiError(400, "tweetId is invalid");
    }

    const { content } = req.body;
    if (!content?.trim()) {
        throw new ApiError(400, "content required");
    }

    const tweet = await Tweet.findById(tweetID);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this tweet");
    }

    tweet.content = content.trim();
    await tweet.save();

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetID } = req.params;

    if (!mongoose.Types.ObjectId.isValid(tweetID)) {
        throw new ApiError(400, "tweetId is invalid");
    }

    const tweet = await Tweet.findById(tweetID);
    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this tweet");
    }

    //await Tweet.findByIdAndDelete(tweetID)
    // more efficient: delete the already-fetched tweet
    await tweet.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet deleted successfully"));

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}