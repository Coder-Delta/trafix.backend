import { dataStore } from '../store/persistence.js';
import { trajectoryService } from '../services/trajectory.service.js';
import { HttpError } from '../utils/httpError.js';

export const searchVehicles = async (req, res, next) => {
  try {
    const { plate_number, q, camera_id } = req.query;
    const queryStr = plate_number || q || '';

    let vehicles = dataStore.getAllVehicles();

    if (queryStr) {
      const clean = queryStr.replace(/[\s-]/g, '').toUpperCase();
      vehicles = vehicles.filter((v) => {
        const p = (v.plate_number || v.plateNumber || '').replace(/[\s-]/g, '').toUpperCase();
        return p === clean || p.includes(clean);
      });
    }

    if (camera_id) {
      vehicles = vehicles.filter((v) => v.camera_id === camera_id || v.camera_ids?.includes(camera_id));
    }

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        total: vehicles.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;
    let vehicle = dataStore.getVehicleById(vehicle_id);

    if (!vehicle) {
      vehicle = dataStore.findVehicleByPlate(vehicle_id);
    }

    if (!vehicle) {
      throw new HttpError('NOT_FOUND', `Vehicle ${vehicle_id} not found`, 404);
    }

    res.status(200).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleEvents = async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;
    let vehicle = dataStore.getVehicleById(vehicle_id);

    if (!vehicle) {
      vehicle = dataStore.findVehicleByPlate(vehicle_id);
    }

    const events = vehicle ? dataStore.getDetectionsByVehicleId(vehicle.vehicle_id) : [];

    res.status(200).json({
      success: true,
      data: {
        vehicle_id: vehicle?.vehicle_id || vehicle_id,
        plate_number: vehicle?.plate_number || vehicle_id,
        events,
        total: events.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleTrajectory = async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;
    const result = await trajectoryService.getTrajectoryByVehicleId(vehicle_id);

    if (!result.success || !result.data) {
      return res.status(200).json({
        success: true,
        data: {
          vehicle_id,
          plate_number: vehicle_id,
          points: [],
          summary: { total_points: 0 },
        },
      });
    }

    res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    next(error);
  }
};

export default { searchVehicles, getVehicleById, getVehicleEvents, getVehicleTrajectory };
