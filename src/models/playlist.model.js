import mongoose, { Schema } from "mongoose";

const playlistSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true // removes leading/trailing spaces
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    isPublic: {
      type: Boolean,
      default: true // public by default
    },
    videos: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
        default: [] // avoids undefined arrays
      }
    ],
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true // every playlist must have an owner
    }
  },
  { timestamps: true }
);

export const Playlist = mongoose.model("Playlist", playlistSchema);
