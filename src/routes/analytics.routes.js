import express from 'express';
import { getAnalyticsOverview } from '../controllers/analytics.controller.js';
import { publicAccess, requireOperator } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/overview', publicAccess, getAnalyticsOverview);

export default router;
