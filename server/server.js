import dotenv from "dotenv"
dotenv.config()

import express from "express";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";
import cors from "cors"; // Corrected import
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const outputDir = path.join(__dirname, '../output');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

import videoRouter from "../router/route.video.js"

const app = express();
const port = process.env.PORT || 3000;
app.use("/output", express.static(path.join(__dirname, "output")));
app.use((req, res, next) => {
  console.log("Request to static path:", req.originalUrl);
  next();
});


app.use(cors({
  origin: "http://localhost:3000", // Allow only this origin
}));


app.use((req, res, next) => {
  res.setHeader("Accept-Ranges", "bytes");
  next();
});
app.use((req, res, next) => {
  console.log(`${req.method} request made to: ${req.originalUrl}`);
  if (req.method === "POST" || req.method === "PUT") {
    console.log("Request Body:", req.body);
  }
  next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(videoRouter)

app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
