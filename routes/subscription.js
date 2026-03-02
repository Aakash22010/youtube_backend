import express from "express";
import User from "../models/User.js";
import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import Subscription from "../models/Subscription.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

/* ============================= */
/*        TOGGLE SUBSCRIBE       */
/* ============================= */
router.post("/:channelId", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });
    const channel = await Channel.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.owner.equals(currentUser._id)) {
      return res.status(400).json({
        message: "You cannot subscribe to your own channel",
      });
    }

    const existing = await Subscription.findOne({
      subscriber: currentUser._id,
      channel: channel._id,
    });

    if (existing) {
      await existing.deleteOne();
    } else {
      await Subscription.create({
        subscriber: currentUser._id,
        channel: channel._id,
      });
    }

    const subscriberCount = await Subscription.countDocuments({
      channel: channel._id,
    });

    res.json({
      subscribed: !existing,
      subscriberCount,
    });

  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ message: "Subscription error" });
  }
});

/* ============================= */
/*     GET SUBSCRIPTION STATUS   */
/* ============================= */
router.get("/:channelId/status", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });
    const channel = await Channel.findById(req.params.channelId);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const existing = await Subscription.findOne({
      subscriber: currentUser._id,
      channel: channel._id,
    });

    const subscriberCount = await Subscription.countDocuments({
      channel: channel._id,
    });

    res.json({
      subscribed: !!existing,
      subscriberCount,
    });

  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ message: "Status error" });
  }
});

/* ============================= */
/*         SUBSCRIPTION FEED     */
/* ============================= */
router.get("/feed/me", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });

    const subs = await Subscription.find({
      subscriber: currentUser._id,
    });

    const channelIds = subs.map((s) => s.channel);

    const videos = await Video.find({
      channel: { $in: channelIds },
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