import express from 'express';
import {
  listCameras,
  getCameraById,
  getCameraStatus,
  cameraHeartbeat,
  createCamera,
  deleteCamera,
  resetCameras,
  updateCameraDetails,
  streamCamera,
  listAvailableVideos,
} from '../controllers/camera.controller.js';
import { publicAccess, requireOperator } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', publicAccess, listCameras);
router.get('/videos', publicAccess, listAvailableVideos);
router.post('/', publicAccess, createCamera);
router.post('/reset', publicAccess, resetCameras);
router.get('/:camera_id', publicAccess, getCameraById);
router.get('/:camera_id/status', publicAccess, getCameraStatus);
router.get('/:camera_id/stream', publicAccess, streamCamera);
router.patch('/:camera_id', publicAccess, updateCameraDetails);
router.put('/:camera_id', publicAccess, updateCameraDetails);
router.delete('/:camera_id', publicAccess, deleteCamera);
router.post('/:camera_id/heartbeat', publicAccess, cameraHeartbeat);

export default router;
