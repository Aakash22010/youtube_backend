import express from "express";
import Comment from "../models/Comment.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Add comment
 */
router.post("/:videoId", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ uid: req.user.uid });

    const comment = await Comment.create({
      video: req.params.videoId,
      user: dbUser._id,
      text: req.body.text,
      parent: req.body.parent || null,
    });

    const populated = await comment.populate("user", "name avatar");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: "Error creating comment" });
  }
});

/**
 * Get comments for video
 */
router.get("/:videoId", async (req, res) => {
  try {
    const comments = await Comment.find({
      video: req.params.videoId,
      parent: null,
    })
      .populate("user", "name avatar")
      .sort({ createdAt: -1 });

    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: "Error fetching comments" });
  }
});

/**
 * Delete comment
 */
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ uid: req.user.uid });
    const comment = await Comment.findById(req.params.id);

    if (!comment) return res.status(404).json({ message: "Not found" });

    if (comment.user.toString() !== dbUser._id.toString()) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await comment.deleteOne();

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting comment" });
  }
});

export default router;