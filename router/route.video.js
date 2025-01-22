import express from 'express';
import {
    uploadVideo,
    get_video,
    get_m3u8
} from "../controller/video.js"

const router = express.Router()

router.post('/upload',uploadVideo);
router.get('/get-video/:id/:filename', get_video);
router.get("/get-masterFile/:id/master.m3u8",get_m3u8);
export default router
