import mongoose from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {Like} from "../models/like.model.js"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    console.log('createTweet called with content:', content, 'user:', req.user?._id);

    if (!content || content.trim() === "") {
        throw new ApiError(400, "Tweet content is required");
    }

    const owner = req.user?._id;
    if (!owner) {
    throw new ApiError(401, "Unauthorized request");
    }

    const tweet = await Tweet.create({
        content: content.trim(),
        owner
    })

    console.log('Tweet created:', tweet._id, 'owner:', tweet.owner);

    if(!tweet){
        throw new ApiError(401,"tweet not created")
    }

    return res
    .status(201)
    .json(new ApiResponse(201,tweet,"tweet created successfully"))

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const { username } = req.params;

    console.log('getUserTweets called with username:', username);

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing");
    }

    const user = await User.findOne({ username: username.trim().toLowerCase() });
    console.log('User found:', user ? user._id : 'null');

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const tweets = await Tweet.find({ owner: user._id })
        .sort({ createdAt: -1 }); // newest first

    // Add likes and comments count to each tweet
    const tweetsWithCounts = await Promise.all(
        tweets.map(async (tweet) => {
            const likesCount = await Like.countDocuments({ tweet: tweet._id });
            const commentsCount = await Comment.countDocuments({ tweet: tweet._id });
            return {
                ...tweet.toObject(),
                likesCount,
                commentsCount
            };
        })
    );

    console.log('Tweets found:', tweetsWithCounts.length, 'for user:', user._id);

    return res
        .status(200)
        .json(new ApiResponse(200, tweetsWithCounts, "User tweets fetched successfully"));
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

const getAllTweets = asyncHandler(async (req, res) => {
    // Get all tweets for public feed
    const { page = 1, limit = 10 } = req.query;

    const tweets = await Tweet.find({})
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 })
        .skip((page - 1) * parseInt(limit))
        .limit(parseInt(limit));

    // Add likes and comments count to each tweet
    const tweetsWithCounts = await Promise.all(
        tweets.map(async (tweet) => {
            const likesCount = await Like.countDocuments({ tweet: tweet._id });
            const commentsCount = await Comment.countDocuments({ tweet: tweet._id });
            return {
                ...tweet.toObject(),
                likesCount,
                commentsCount
            };
        })
    );

    const totalTweets = await Tweet.countDocuments();

    return res
        .status(200)
        .json(new ApiResponse(200, {
            tweets: tweetsWithCounts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                totalTweets,
                totalPages: Math.ceil(totalTweets / parseInt(limit))
            }
        }, "All tweets fetched successfully"));
});

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
    getAllTweets,
    updateTweet,
    deleteTweet
}