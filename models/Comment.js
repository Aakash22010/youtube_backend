import mongoose from "mongoose";

const commentSchema = mongoose.Schema(
  {
    video: { type: mongoose.Schema.Types.ObjectId, ref: "Video" },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: String,
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Comment", default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);