import mongoose, { Schema } from "mongoose";

const subscriptionSchema = new Schema(
  {
    subscriber: {
      type: Schema.Types.ObjectId, // one who is subscribing
      ref: "User",
      required: true, // improvement: must have a subscriber
    },
    channel: {
      type: Schema.Types.ObjectId, // one to whom user is subscribing
      ref: "User",
      required: true, // improvement: must have a channel
    },
  },
  {
    timestamps: true, // improvement: track when subscription is created/updated
  }
);

// improvement: prevent duplicate subscriptions (same subscriber → same channel)
subscriptionSchema.index({ subscriber: 1, channel: 1 }, { unique: true });

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
