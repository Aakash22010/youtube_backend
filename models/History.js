import mongoose from "mongoose";

const historySchema = new mongoose.Schema(
  {
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true
    },
    lastWatchedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

historySchema.index({ viewer: 1, video: 1 }, { unique: true });

export default mongoose.model("History", historySchema);