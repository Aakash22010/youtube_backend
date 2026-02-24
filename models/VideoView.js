import mongoose from "mongoose";

const videoViewSchema = mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
    },
    viewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Ensure one unique view per user per video
videoViewSchema.index({ video: 1, viewer: 1 }, { unique: true });

export default mongoose.model("VideoView", videoViewSchema);