dotenv.config();
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

import videoRoutes from "./routes/videos.js";
import userRoutes from "./routes/user.js";
import commentRoutes from "./routes/comment.js";
import subscriptionRoutes from "./routes/subscription.js";
import channelRoutes from "./routes/channel.js";
import historyRoutes from "./routes/history.js";


const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("Mongo Connected"))
  .catch((err) => console.log(err));

app.use("/api/videos", videoRoutes);
app.use("/api/users", userRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/channel", channelRoutes);
app.use("/api/history", historyRoutes);

app.listen(process.env.PORT, "0.0.0.0", () =>
  console.log("Server running on", process.env.PORT)
);