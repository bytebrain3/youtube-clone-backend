import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from 'uuid'; // Import uuid

// Convert __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer storage with UUID
const storage = multer.diskStorage({
    destination: uploadDir, // Destination folder
    filename: (req, file, cb) => {
        // Generate a new UUID for each file upload
        const uniqueFilename = uuidv4() + path.extname(file.originalname); // Use original file extension
        cb(null, uniqueFilename); // Save file with the generated UUID
    },
});

// File Filter (Only allows MP4 files)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["video/mp4"];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error("Invalid file type. Only MP4 files are allowed.");
        error.status = 400; // Set HTTP status code
        cb(error, false);
    }
};

// Configure multer for file upload with the new storage
const upload = multer({ storage: storage, fileFilter: fileFilter });

// POST route to handle video upload and transcoding
app.post("/upload", upload.single("video"), (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded",
        });
    }

    // Path to the uploaded video file
    const inputFilePath = path.join(uploadDir, req.file.filename);
    const outputDir = path.join(__dirname, '../output');

    // Ensure the output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
    }

    // FFmpeg command to create multiple HLS streams
    ffmpeg(inputFilePath)
        .output(path.join(outputDir, '360p.m3u8'))
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('640x360')
        .outputOptions([
            '-b:v 800k',
            '-maxrate:v 856k',
            '-bufsize:v 1200k',
            '-hls_time 10',
            '-hls_playlist_type vod',
            '-hls_segment_filename ' + path.join(outputDir, '360p_%03d.ts'),
        ])
        .output(path.join(outputDir, '480p.m3u8'))
        .size('854x480')
        .outputOptions([
            '-b:v 1400k',
            '-maxrate:v 1498k',
            '-bufsize:v 2100k',
            '-hls_segment_filename ' + path.join(outputDir, '480p_%03d.ts'),
        ])
        .output(path.join(outputDir, '720p.m3u8'))
        .size('1280x720')
        .outputOptions([
            '-b:v 2800k',
            '-maxrate:v 2996k',
            '-bufsize:v 4200k',
            '-hls_segment_filename ' + path.join(outputDir, '720p_%03d.ts'),
        ])
        .output(path.join(outputDir, '1080p.m3u8'))
        .size('1920x1080')
        .outputOptions([
            '-b:v 5000k',
            '-maxrate:v 5350k',
            '-bufsize:v 7500k',
            '-hls_segment_filename ' + path.join(outputDir, '1080p_%03d.ts'),
        ])
        .on('end', () => {
            console.log('Transcoding complete.');
            // Send success response after transcoding
            res.status(200).json({
                success: true,
                message: "Video transcoding complete. Check the output folder for HLS files.",
            });
        })
        .on('error', (err) => {
            console.log('Error during transcoding: ', err);
            res.status(500).json({
                success: false,
                message: "Transcoding failed",
            });
        })
        .run();
});

// Start server
app.listen(8000, () => {
    console.log("Server is running on http://localhost:8000");
});
