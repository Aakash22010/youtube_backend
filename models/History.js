import mongoose from "mongoose";

const historySchema = mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// One history record per user per video
historySchema.index({ viewer: 1, video: 1 }, { unique: true });

export default mongoose.model("History", historySchema);