import mongoose from "mongoose";

const videoSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    tags: [String],
    category: String,

    visibility: { type: String, default: "public" },

    views: { type: Number, default: 0 },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Video", videoSchema);