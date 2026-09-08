import express from 'express';
import { getAnalyticsOverview, getAlerts } from '../controllers/analytics.controller.js';
import { publicAccess, requireOperator } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/overview', publicAccess, getAnalyticsOverview);
router.get('/alerts', publicAccess, getAlerts);

export default router;
