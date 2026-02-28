import express from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
import { verifyToken } from "../middleware/auth.js";

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
      .populate("channel", "name avatar")
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

router.post("/create", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Channel name is required" });
    }

    const user = await User.findOne({ uid: req.user.uid });

    const channel = await Channel.create({
      owner: user._id,
      name,
      description,
    });

    res.json(channel);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Channel creation failed" });
  }
});

router.put("/:channelId", verifyToken, async (req, res) => {
  try {
    const { name, description } = req.body;

    const channel = await Channel.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    channel.name = name;
    channel.description = description;

    await channel.save();

    res.json(channel);

  } catch (err) {
    res.status(500).json({ message: "Channel update failed" });
  }
});

export default router;