import express from 'express';
import { playCameraDetection, stopCameraDetection, getSimulationStatus } from '../controllers/simulation.controller.js';
import { publicAccess } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/status', publicAccess, getSimulationStatus);
router.post('/play-camera', publicAccess, playCameraDetection);
router.post('/stop-camera', publicAccess, stopCameraDetection);

export default router;
