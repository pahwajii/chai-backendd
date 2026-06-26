import { Subscription } from "../models/subscription.model.js";

export async function getSubscribersCount(userId) {
  // Count how many subscriptions have this user as the channel
  return await Subscription.countDocuments({ channel: userId });
}
