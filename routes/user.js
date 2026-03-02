import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import User from "../models/User.js";
import { verifyToken } from "../middleware/auth.js";
import Video from "../models/Video.js";
import Subscription from "../models/Subscription.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

/* ============================= */
/*        SYNC FIREBASE USER     */
/* ============================= */
router.post("/sync", verifyToken, async (req, res) => {
  try {
    let user = await User.findOne({ uid: req.user.uid });

    if (!user) {
      user = await User.create({
        uid: req.user.uid,
        email: req.user.email,
        name: req.user.name || "New User",
        avatar: req.user.picture || "",
        role: "user",
      });
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "User sync failed" });
  }
});

/* ============================= */
/*       GET CURRENT USER        */
/* ============================= */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    res.json(user);
  } catch {
    res.status(500).json({ message: "Profile fetch failed" });
  }
});

/* ============================= */
/*        UPDATE PROFILE         */
/* ============================= */
router.put("/me", verifyToken, upload.single("avatar"), async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.file) {
      const uploadRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "youtube-clone/avatars",
      });
      user.avatar = uploadRes.secure_url;
    }

    if (req.body.name) user.name = req.body.name;
    if (req.body.bio) user.bio = req.body.bio;

    await user.save();
    res.json(user);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Update failed" });
  }
});

router.post("/channel/create", verifyToken, async (req, res) => {
  try {
    const { name, bio } = req.body;

    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name || user.name;
    user.bio = bio || user.bio;

    await user.save();

    res.json(user);

  } catch (err) {
    console.error("Channel create error:", err);
    res.status(500).json({ message: "Channel create error" });
  }
});

router.put("/channel/edit", verifyToken, async (req, res) => {
  try {
    const { name, bio } = req.body;

    const user = await User.findOne({ uid: req.user.uid });

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = name;
    user.bio = bio;

    await user.save();

    res.json(user);

  } catch (err) {
    console.error("Channel update error:", err);
    res.status(500).json({ message: "Channel update error" });
  }
});

router.get("/dashboard/stats", verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    const channel = await Channel.findOne({ owner: user._id });

    if (!channel) {
      return res.json({
        totalVideos: 0,
        totalSubscribers: 0,
        totalViews: 0,
      });
    }

    const totalVideos = await Video.countDocuments({
      channel: channel._id,
    });

    const totalViewsAgg = await Video.aggregate([
      { $match: { channel: channel._id } },
      { $group: { _id: null, total: { $sum: "$views" } } },
    ]);

    const totalSubscribers = await Subscription.countDocuments({
      channel: channel._id,
    });

    res.json({
      totalVideos,
      totalSubscribers,
      totalViews: totalViewsAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Dashboard stats error" });
  }
});

// =============================
// CHANNEL ANALYTICS (SAFE)
// =============================
router.get("/studio/analytics", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ uid: req.user.uid });
    const channel = await Channel.findOne({ owner: dbUser._id });

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    const videos = await Video.find({ channel: channel._id });

    const totalViews = videos.reduce((sum, v) => {
      return sum + (v.views || 0);
    }, 0);

    const avgMinutes = 3;
    const watchTimeHours = ((totalViews * avgMinutes) / 60).toFixed(1);

    const totalSubscribers = await Subscription.countDocuments({
      channel: channel._id,
    });

    const fortyEightAgo = new Date();
    fortyEightAgo.setHours(fortyEightAgo.getHours() - 48);

    const recentVideos = await Video.find({
      channel: channel._id,
      updatedAt: { $gte: fortyEightAgo },
    });

    const viewsLast48h = recentVideos.reduce((sum, v) => {
      return sum + (v.views || 0);
    }, 0);

    const topVideos = await Video.find({ channel: channel._id })
      .sort({ views: -1 })
      .limit(3)
      .select("title views thumbnailUrl");

    res.json({
      totalViews,
      watchTimeHours,
      totalSubscribers,
      subscribersLast7Days: 0,
      viewsLast48h,
      topVideos,
    });

  } catch (err) {
    console.error("ANALYTICS ERROR:", err);
    res.status(500).json({
      message: "Analytics failed",
      error: err.message,
    });
  }
});

export default router;