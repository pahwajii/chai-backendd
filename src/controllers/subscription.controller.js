import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// toggle subscription (subscribe/unsubscribe)
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "channelId is invalid");
    }

    if (req.user._id.toString() === channelId) {
        throw new ApiError(400, "You cannot subscribe to yourself");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: req.user._id,
        channel: channelId,
    });

    if (existingSubscription) {
        // ❌ Mistake before: passed the whole object to findByIdAndDelete
        // ✅ Fix: use existingSubscription._id
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res
            .status(200)
            .json(new ApiResponse(200, null, "Unsubscribed successfully"));
    } else {
        const subscription = await Subscription.create({
            subscriber: req.user._id,
            channel: channelId,
        })
        return res
            .status(201)
            .json(new ApiResponse(201, subscription, "Subscribed successfully"));
    }
})


// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "channelId is invalid");
    }
    if (req.user._id.toString() === channelId) {
        // ❌ Mistake: unclear message ("no channel")
        // ✅ Better: you may skip or give a proper message
        throw new ApiError(400, "You cannot fetch your own channel this way");
    }

    const channel = await User.findById(channelId);
    if (!channel) {
        throw new ApiError(404, "Channel not found");
    }

    // Always remember — when using .find() with .populate(), you must await the final query.
    // ❌ Mistake before: did not await .populate()
    // ✅ Fix: chain .populate() and await it directly
    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber")

    return res
        .status(200)
        .json(new ApiResponse(200, subscribers, "subscribers fetched"))

})


// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
        throw new ApiError(400, "subscriberId is invalid");
    }

    const subscriberedchannel = await User.findById(subscriberId);
    if (!subscriberedchannel) {
        // ❌ Mistake before: wrong error message ("subscribed channels not found")
        // ✅ Fix: it should be about the subscriber
        throw new ApiError(404, "Subscriber not found");
    }

    // ❌ Mistake before: wrote wrong field ("subs" instead of subscriber)
    // ✅ Fix: correct query is { subscriber: subscriberId }
    // ❌ Mistake before: did not await .populate("channel")
    const channels = await Subscription.find({ subscriber: subscriberId })
        .populate("channel")

    return res
        .status(200)
        .json(new ApiResponse(200, channels, "subscribers fethed"))

})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}

/* 
====================== 🔑 SUMMARY: MISTAKES MADE ======================

1. ❌ Using `findByIdAndDelete(existingSubscription)` 
   → Wrong, because it needs an ID, not the whole object.
   ✅ Use `existingSubscription._id`.

2. ❌ Forgetting to `await` .populate() 
   → Without await, populate does not execute.
   ✅ Always do: `await Model.find(...).populate("field")`.

3. ❌ Wrong query field in getSubscribedChannels
   → Used `{ subs: channelId }`.
   ✅ Correct: `{ subscriber: subscriberId }`.

4. ❌ Wrong / unclear error messages
   → Example: "no channel" or "subscribed channels not found".
   ✅ Use clear messages like "Channel not found" or "Subscriber not found".

5. ❌ Wrong status codes in some places
   → Used 201 for GET requests.
   ✅ Use 200 for successful GET, 201 for CREATE.

====================== 📌 POINTS TO REMEMBER ======================

1. Always validate IDs with:
   if (!mongoose.Types.ObjectId.isValid(id)) throw ApiError(400, "Invalid ID");

2. For DELETE operations → pass `_id`, not the full object.

3. When using `.populate()`, chain it before await:
   const data = await Model.find(...).populate("field");

4. GET requests → status 200
   POST/CREATE → status 201
   DELETE (success, no content) → status 200 or 204

5. Error messages should be clear and specific. 
   (Helps in debugging and frontend integration.)

6. Keep consistent naming:
   - `subscriber` = who subscribes
   - `channel` = who gets subscribed to

==================================================================
*/