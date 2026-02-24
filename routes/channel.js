import express from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";

const router = express.Router();

/**
 * Get Channel Info + Videos
 */
router.get("/:id", async (req, res) => {
  try {
    const channel = await User.findById(req.params.id).select(
      "name avatar bio subscribers createdAt"
    );

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const videos = await Video.find({
      owner: req.params.id,
      visibility: "public",
    })
      .populate("owner", "name avatar")
      .sort({ createdAt: -1 });

    res.json({
      channel,
      videos,
      subscriberCount: channel.subscribers.length,
    });

  } catch (err) {
    res.status(500).json({ message: "Channel error" });
  }
});

export default router;