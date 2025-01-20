import { upload } from "../lib/config.multer.js";
import { v4 as uuidv4 } from "uuid";
import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import mime from "mime";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = path.join(__dirname, "../output");

// Ensure the output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

export const uploadVideo = (req, res) => {
  const folderId = uuidv4();
  req.folderId = folderId;

  const outputPath = path.join(outputDir, folderId);

  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  upload.single("video")(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    console.log("Uploaded file path:", req.file.path);

    const qualities = [
      {
        resolution: "640x360",
        bitrate: "800k",
        maxrate: "856k",
        bufsize: "1200k",
        file: "360p.m3u8",
        name: "360",
        segments: "360p_%03d.ts",
      },
      {
        resolution: "854x480",
        bitrate: "1400k",
        maxrate: "1498k",
        bufsize: "2100k",
        file: "480p.m3u8",
        name: "480",
        segments: "480p_%03d.ts",
      },
      {
        resolution: "1280x720",
        bitrate: "2800k",
        maxrate: "2996k",
        bufsize: "4200k",
        file: "720p.m3u8",
        name: "720",
        segments: "720p_%03d.ts",
      },
      {
        resolution: "1920x1080",
        bitrate: "5000k",
        maxrate: "5350k",
        bufsize: "7500k",
        file: "1080p.m3u8",
        name: "1080",
        segments: "1080p_%03d.ts",
      },
    ];

    const ffmpegCommand = ffmpeg(req.file.path);

    qualities.forEach((quality) => {
      ffmpegCommand
        .output(path.join(outputPath, quality.file))
        .videoCodec("libx264")
        .audioCodec("aac")
        .size(quality.resolution)
        .outputOptions([
          `-b:v ${quality.bitrate}`,
          `-maxrate:v ${quality.maxrate}`,
          `-bufsize:v ${quality.bufsize}`,
          "-hls_time 10",
          "-hls_playlist_type vod",
          `-hls_segment_filename ${path.join(outputPath, quality.segments)}`,
        ]);
    });

    ffmpegCommand
      .on("start", (cmd) => console.log("FFmpeg command:", cmd))
      .on("stderr", (stderrLine) => console.log("FFmpeg stderr:", stderrLine))
      .on("end", () => {
        console.log("Transcoding complete.");

        // Generate the master.m3u8 file
        const masterPlaylistPath = path.join(outputPath, "master.m3u8");
        let filePath = outputPath.split("backend")[1];
        const masterPlaylistContent = qualities
          .map(
            (quality) =>
              `#EXT-X-STREAM-INF:BANDWIDTH=${
                parseInt(quality.bitrate) * 1000
              },RESOLUTION=${quality.resolution}\n${filePath}${quality.name}${
                quality.file
              }`
          )
          .join("\n");

        const masterPlaylistHeader = "#EXTM3U\n";
        fs.writeFileSync(
          masterPlaylistPath,
          masterPlaylistHeader + masterPlaylistContent
        );

        // Clean up the uploaded file
        fs.rm(req.file.path, { recursive: true, force: true }, (err) => {
          if (err) {
            console.error("Error deleting uploaded file:", err);
          } else {
            console.log("Uploaded file deleted successfully.");
          }
        });

        res.status(200).json({
          success: true,
          message:
            "Video transcoding complete. Check the output folder for HLS files.",
          id: folderId, // Provide the folderId for retrieval
        });
      })
      .on("error", (err) => {
        console.error("Error during transcoding:", err);
        res.status(500).json({
          success: false,
          message: "Transcoding failed",
        });
      })
      .run();
  });
};

export const get_video = async (req, res) => {
  try {
    const videoId = req.params.id;
    const videoPath = path.join(outputDir, videoId, "master.m3u8");

    if (fs.existsSync(videoPath)) {
      const contentType =
        mime.getType(videoPath) || "application/vnd.apple.mpegurl";

      res.setHeader("Content-Type", contentType);
      res.sendFile(videoPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res
            .status(500)
            .json({ success: false, message: "Error serving the file" });
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }
  } catch (err) {
    console.error("Error fetching video:", err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
export const video = async (req, res) => {
  try {
    const videoId = req.params.id;
    const videoPath = path.join(outputDir, videoId, "master.m3u8");

    if (fs.existsSync(videoPath)) {
      const contentType =
        mime.getType(videoPath) || "application/vnd.apple.mpegurl";

      res.setHeader("Content-Type", contentType);
      res.sendFile(videoPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res
            .status(500)
            .json({ success: false, message: "Error serving the file" });
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Playlist not found",
      });
    }
  } catch (err) {
    console.error("Error fetching video:", err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};