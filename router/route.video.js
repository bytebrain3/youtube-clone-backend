import express from 'express';
import {
    uploadVideo,
    get_video,
    video
} from "../controller/video.js"

const router = express.Router()

router.post('/upload',uploadVideo);
router.get("/get-video/:id",get_video)
router.get("/output/:id",video)
export default router