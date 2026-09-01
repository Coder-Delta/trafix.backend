import express from 'express';
import { getTrafficOverview, getTrafficByCamera, getTrafficByRoute } from '../controllers/traffic.controller.js';
import { publicAccess } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', publicAccess, getTrafficOverview);
router.get('/route/:route_id', publicAccess, getTrafficByRoute);
router.get('/:camera_id', publicAccess, getTrafficByCamera);

export default router;
