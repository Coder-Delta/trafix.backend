import express from 'express';
import { searchVehicles, getVehicleById, getVehicleEvents, getVehicleTrajectory } from '../controllers/vehicle.controller.js';
import { publicAccess, requireOperator } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/search', publicAccess, searchVehicles);
router.get('/:vehicle_id', publicAccess, getVehicleById);
router.get('/:vehicle_id/events', publicAccess, getVehicleEvents);
router.get('/:vehicle_id/trajectory', publicAccess, getVehicleTrajectory);

export default router;
