import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    uid: { type: String, required: true, unique: true, index: true },
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    role: { type: String, default: "user" }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);