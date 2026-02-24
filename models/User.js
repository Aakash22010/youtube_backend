import mongoose from "mongoose";

const userSchema = mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true },
    name: String,
    email: String,
    avatar: String,
    bio: String,
    role: { type: String, default: "user" },

    subscribers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],

    subscriptions: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ]
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);