import express from "express";
import multer from "multer";
import fs from "fs";
import cloudinary from "../config/cloudinary.js";
import Video from "../models/Video.js";
import User from "../models/User.js";
import VideoView from "../models/VideoView.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// TEMP storage for multer before sending to Cloudinary
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 1024 * 1024 * 200, // 200MB max
  },
});

/* ============================= */
/*         UPLOAD VIDEO          */
/* ============================= */
router.post(
  "/upload",
  verifyToken,
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      console.log("REQ BODY:", req.body); // debugging

      if (!req.files?.video || !req.files?.thumbnail) {
        return res.status(400).json({ message: "Files missing" });
      }

      const dbUser = await User.findOne({ uid: req.user.uid });
      if (!dbUser) {
        return res.status(401).json({ message: "User not found" });
      }

      const videoPath = req.files.video[0].path;
      const thumbnailPath = req.files.thumbnail[0].path;
      const videoUpload = await cloudinary.uploader.upload(videoPath, {
        resource_type: "video",
        folder: "youtube-clone/videos",
      });

      const thumbnailUpload = await cloudinary.uploader.upload(
        thumbnailPath,
        {
          resource_type: "image",
          folder: "youtube-clone/thumbnails",
        }
      );

      const categoryValue = req.body.category
        ? req.body.category.trim()
        : null;

      const newVideo = await Video.create({
        title: req.body.title,
        description: req.body.description,
        category: categoryValue, // ← THIS LINE FIXES IT
        owner: dbUser._id,
        videoUrl: videoUpload.secure_url,
        thumbnailUrl: thumbnailUpload.secure_url,
        tags: req.body.tags ? req.body.tags.split(",") : [],
      });

      const populated = await newVideo.populate("channel", "name avatar");

      res.json(populated);

    } catch (error) {
      console.error("UPLOAD ERROR:", error);
      res.status(500).json({
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

/* ============================= */
/*        FETCH ALL VIDEOS       */
/* ============================= */
router.get("/", async (req, res) => {
  try {
    const { category } = req.query;

    const filter = { visibility: "public" };

    if (category && category !== "All") {
      filter.category = category;
    }

    const videos = await Video.find(filter)
      .populate("channel", "name avatar")
      .sort({ createdAt: -1 });

    res.json(videos);

  } catch (err) {
    res.status(500).json({ message: "Fetch failed" });
  }
});

/* ============================= */
/*       FETCH SINGLE VIDEO      */
/* ============================= */
router.get("/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("channel", "name avatar");

    res.json(video);
  } catch (err) {
    res.status(500).json({ message: "Video fetch failed" });
  }
});

/* ============================= */
/*          LIKE VIDEO           */
/* ============================= */
router.post("/:id/like", verifyToken, async (req, res) => {
  try {
    const dbUser = await User.findOne({ uid: req.user.uid });
    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const liked = video.likes.includes(dbUser._id);

    if (liked) {
      video.likes.pull(dbUser._id);
    } else {
      video.likes.push(dbUser._id);
    }

    await video.save();

    res.json(video);
  } catch (err) {
    res.status(500).json({ message: "Like failed" });
  }
});

// =============================
// GET ALL CATEGORIES (DYNAMIC)
// =============================
router.get("/categories/list", async (req, res) => {
  try {
    const categories = await Video.aggregate([
      {
        $match: { visibility: "public", category: { $ne: null } }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formatted = categories.map((cat) => ({
      name: cat._id,
      count: cat.count
    }));

    res.json(formatted);

  } catch (err) {
    res.status(500).json({ message: "Category fetch failed" });
  }
});

// GET Trending Videos
router.get("/trending/list", async (req, res) => {
  try {
    const videos = await Video.find({ visibility: "public" })
      .populate("channel", "name avatar")
      .sort({ views: -1 })
      .limit(20);

    res.json(videos);
  } catch (err) {
    console.error("Trending error:", err);
    res.status(500).json({ message: "Trending error" });
  }
});

// GET My Liked Videos
router.get("/liked/me", verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findOne({ uid: req.user.uid });

    const videos = await Video.find({
      likes: currentUser._id,
      visibility: "public",
    })
      .populate("channel", "name avatar")
      .sort({ createdAt: -1 });

    res.json(videos);

  } catch (err) {
    console.error("Liked videos error:", err);
    res.status(500).json({ message: "Liked videos error" });
  }
});

/* ============================= */
/*         UNIQUE VIEW           */
/* ============================= */
router.post("/:id/view", async (req, res) => {
  try {
    const videoId = req.params.id;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];

      try {
        const admin = (await import("../config/firebase.js")).default;
        const decoded = await admin.auth().verifyIdToken(token);

        const dbUser = await User.findOne({ uid: decoded.uid });

        const existing = await VideoView.findOne({
          video: videoId,
          viewer: dbUser._id,
        });

        if (!existing) {
          await VideoView.create({
            video: videoId,
            viewer: dbUser._id,
          });

          await Video.findByIdAndUpdate(videoId, {
            $inc: { views: 1 },
          });
        }
      } catch {
        // Ignore invalid token
      }
    }

    const updated = await Video.findById(videoId);
    res.json({ views: updated?.views || 0 });

  } catch (err) {
    res.status(500).json({ message: "View error" });
  }
});

export default router;