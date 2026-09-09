import express from 'express';
import { playCameraDetection } from '../controllers/simulation.controller.js';
import { publicAccess } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/play-camera', publicAccess, playCameraDetection);

export default router;
