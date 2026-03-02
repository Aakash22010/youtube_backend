import mongoose from "mongoose";

const channelSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    name: { type: String, required: true },
    description: { type: String, default: "" },
    avatar: { type: String, default: "" }
  },
  { timestamps: true }
);

export default mongoose.model("Channel", channelSchema);