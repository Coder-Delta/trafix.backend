import { dataStore } from '../store/persistence.js';
import { HttpError } from '../utils/httpError.js';

export const listCameras = async (req, res, next) => {
  try {
    const cameras = dataStore.getCameras();

    res.status(200).json({
      success: true,
      data: {
        cameras,
        total: cameras.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCameraById = async (req, res, next) => {
  try {
    const { camera_id } = req.params;
    const camera = dataStore.getCamera(camera_id);

    if (!camera) {
      throw new HttpError('NOT_FOUND', `Camera ${camera_id} not found`, 404);
    }

    res.status(200).json({
      success: true,
      data: camera,
    });
  } catch (error) {
    next(error);
  }
};

export const getCameraStatus = async (req, res, next) => {
  try {
    const { camera_id } = req.params;
    const camera = dataStore.getCamera(camera_id);

    if (!camera) {
      throw new HttpError('NOT_FOUND', `Camera ${camera_id} not found`, 404);
    }

    res.status(200).json({
      success: true,
      data: {
        camera_id: camera.camera_id,
        name: camera.name,
        status: camera.status,
        heartbeat_at: camera.last_heartbeat,
        health: {
          latency_ms: camera.status === 'online' ? 24 : 0,
          fps: camera.fps,
          vehicle_count: camera.vehicle_count,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cameraHeartbeat = async (req, res, next) => {
  try {
    const { camera_id } = req.params;
    const body = req.body || {};

    const updated = dataStore.updateCamera(camera_id, {
      status: body.status || 'online',
      fps: body.fps !== undefined ? body.fps : 25,
      processing_latency_ms: body.processing_latency_ms || 28,
    });

    res.status(200).json({
      success: true,
      data: {
        camera_id,
        status: updated?.status || 'online',
        fps: updated?.fps || 25,
        heartbeat_at: updated?.last_heartbeat || new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { listCameras, getCameraById, getCameraStatus, cameraHeartbeat };
