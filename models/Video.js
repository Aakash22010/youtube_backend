import mongoose from "mongoose";

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },

    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },

    channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
      required: true,
      index: true
    },

    tags: [String],
    category: String,
    visibility: { type: String, default: "public" },
    views: { type: Number, default: 0 },

    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);