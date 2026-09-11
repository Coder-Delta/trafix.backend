import express from 'express';
import { playCameraDetection, stopCameraDetection } from '../controllers/simulation.controller.js';
import { publicAccess } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/play-camera', publicAccess, playCameraDetection);
router.post('/stop-camera', publicAccess, stopCameraDetection);

export default router;
