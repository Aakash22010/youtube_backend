import express from "express";
import History from "../models/History.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Save or update watch history
 */
router.post("/:videoId", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ uid: req.user.uid });

    const existing = await History.findOne({
      viewer: dbUser._id,
      video: req.params.videoId,
    });

    if (existing) {
      existing.lastWatchedAt = new Date();
      await existing.save();
    } else {
      await History.create({
        viewer: dbUser._id,
        video: req.params.videoId,
      });
    }

    res.json({ message: "History updated" });

  } catch (err) {
    res.status(500).json({ message: "History error" });
  }
});

/**
 * Get user history
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ uid: req.user.uid });

    const history = await History.find({
      viewer: dbUser._id,
    })
      .populate({
        path: "video",
        populate: {
          path: "channel",
          select: "name avatar",
        },
      })
      .sort({ lastWatchedAt: -1 });

    res.json(history);

  } catch (err) {
    res.status(500).json({ message: "Fetch history error" });
  }
});

export default router;