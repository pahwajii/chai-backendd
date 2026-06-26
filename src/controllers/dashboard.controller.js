import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const {channelID}= req.params

    if(!mongoose.Types.ObjectId.isValid(channelID)){
        throw new ApiError(400,"Invalid channelID")
    }
    const channelstats = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(channelID)
            }
        },
        {
            $lookup :{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "allVideos",
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"allVideos._id",
                foreignField:"video",
                as:"allLikes"
            }
        },
        {
           $addFields: {
            // Count total number of videos uploaded by the channel
            totalVideos: { $size: "$allVideos" },

            // Sum up all views across the channel's videos
            totalViews: { $sum: "$allVideos.views" },

            // Sum up likes from all videos (⚠ only works if 'likes' exists in Video schema)
            totalLikes: { $size: "$allLikes" },  // count of likes from Like collection

            
            // Count total number of subscribers for the channel
            totalSubscribers: { $size: "$subscribers" }
        }

        },
        {
            $project: {
                _id: 1,
                username: 1,
                avatar: 1,
                totalVideos: 1,
                totalViews: 1,
                totalLikes: 1,
                totalSubscribers: 1,
                thumbnail: { $arrayElemAt: ["$allVideos.thumbnail", 0] } // first video thumbnail

            }
        }
    ])

    if(!channelstats.length){
        throw new ApiError(404,"Channel not Found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,"channels stats fetched succesfully ", channelstats[0]))

})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelID}= req.params;

    if((!mongoose.Types.ObjectId.isValid(channelID))){
        throw new ApiError(400,"Invalid ChannelID")
    }

    const videos = await Video.find({
        owner:channelID
    })
    .sort({createdAt:-1})
    .populate("owner","username avatar")
    .select("title description thumbnail views likes createdAt")

    console.log(`Found ${videos.length} videos for channel ${channelID}`);
    console.log('Videos:', videos);

    return res 
    .status(200)
    .json(new ApiResponse(200, videos, "channel videos fetched successfully"))

})

export {
    getChannelStats, 
    getChannelVideos
    }