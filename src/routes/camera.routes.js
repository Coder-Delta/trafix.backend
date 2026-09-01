import express from 'express';
import { listCameras, getCameraById, getCameraStatus, cameraHeartbeat } from '../controllers/camera.controller.js';
import { publicAccess, requireOperator } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', publicAccess, listCameras);
router.get('/:camera_id', publicAccess, getCameraById);
router.get('/:camera_id/status', publicAccess, getCameraStatus);
router.post('/:camera_id/heartbeat', requireOperator, cameraHeartbeat);

export default router;
