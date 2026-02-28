import express from "express";
import User from "../models/User.js";
import Video from "../models/Video.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/**
 * Toggle Subscribe
 */
router.post("/:channelId", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });
    const channel = await User.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // 🔴 Prevent self subscription
    if (currentUser._id.equals(channel._id)) {
      return res.status(400).json({
        message: "You cannot subscribe to your own channel",
      });
    }

    const alreadySubscribed = currentUser.subscriptions.some((id) =>
      id.equals(channel._id)
    );

    if (alreadySubscribed) {
      currentUser.subscriptions.pull(channel._id);
      channel.subscribers.pull(currentUser._id);
    } else {
      currentUser.subscriptions.push(channel._id);
      channel.subscribers.push(currentUser._id);
    }

    await currentUser.save();
    await channel.save();

    res.json({
      subscribed: !alreadySubscribed,
      subscriberCount: channel.subscribers.length,
    });

  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ message: "Subscription error" });
  }
});

/**
 * Get subscription status
 */
router.get("/:channelId/status", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });
    const channel = await User.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const subscribed = currentUser.subscriptions.some((id) =>
      id.equals(channel._id)
    );

    res.json({
      subscribed,
      subscriberCount: channel.subscribers.length,
    });

  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ message: "Status error" });
  }
});

/**
 * Subscription Feed
 */
router.get("/feed/me", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });

    const videos = await Video.find({
      owner: { $in: currentUser.subscriptions },
      visibility: "public",
    })
      .populate("channel", "name avatar")
      .sort({ createdAt: -1 });

    res.json(videos);

  } catch (err) {
    console.error("Feed error:", err);
    res.status(500).json({ message: "Feed error" });
  }
});

export default router;