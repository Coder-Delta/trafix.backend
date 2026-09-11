import { dataStore } from '../store/persistence.js';
import { HttpError } from '../utils/httpError.js';
import { broadcastTrafficEvent } from '../websocket/traffic.ws.js';

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

export const createCamera = async (req, res, next) => {
  try {
    const { name, latitude, longitude, direction, stream_url, streamUrl, fps, camera_id } = req.body || {};

    if (latitude === undefined || longitude === undefined) {
      throw new HttpError('VALIDATION_ERROR', 'Latitude and longitude are required.', 400);
    }

    const camera = dataStore.addCamera({
      camera_id,
      name,
      latitude,
      longitude,
      direction,
      stream_url: stream_url || streamUrl,
      fps,
    });

    broadcastTrafficEvent({
      id: `cam_add_${Date.now()}`,
      type: 'camera_added',
      timestamp: new Date().toISOString(),
      data: camera,
    });

    res.status(201).json({
      success: true,
      data: camera,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCamera = async (req, res, next) => {
  try {
    const { camera_id } = req.params;
    const deleted = dataStore.deleteCamera(camera_id);

    if (!deleted) {
      throw new HttpError('NOT_FOUND', `Camera ${camera_id} not found`, 404);
    }

    broadcastTrafficEvent({
      id: `cam_del_${Date.now()}`,
      type: 'camera_deleted',
      timestamp: new Date().toISOString(),
      data: { camera_id },
    });

    res.status(200).json({
      success: true,
      data: { camera_id, deleted: true },
    });
  } catch (error) {
    next(error);
  }
};

export const resetCameras = async (req, res, next) => {
  try {
    const { mode } = req.body || {};
    let cameras;
    if (mode === 'clear') {
      cameras = dataStore.clearCameras();
    } else {
      cameras = dataStore.resetCameras();
    }

    broadcastTrafficEvent({
      id: `cam_reset_${Date.now()}`,
      type: 'cameras_reset',
      timestamp: new Date().toISOString(),
      data: { cameras, total: cameras.length },
    });

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

export const updateCameraDetails = async (req, res, next) => {
  try {
    const { camera_id } = req.params;
    const body = req.body || {};

    const existing = dataStore.getCamera(camera_id);
    if (!existing) {
      throw new HttpError('NOT_FOUND', `Camera ${camera_id} not found`, 404);
    }

    const updated = dataStore.updateCamera(camera_id, {
      name: body.name !== undefined ? body.name : existing.name,
      latitude: body.latitude !== undefined ? Number(body.latitude) : existing.latitude,
      longitude: body.longitude !== undefined ? Number(body.longitude) : existing.longitude,
      direction: body.direction !== undefined ? body.direction : existing.direction,
      stream_url: body.stream_url || body.streamUrl || existing.stream_url,
      fps: body.fps !== undefined ? Number(body.fps) : existing.fps,
      status: body.status || existing.status,
    });

    broadcastTrafficEvent({
      id: `cam_upd_${Date.now()}`,
      type: 'camera_updated',
      timestamp: new Date().toISOString(),
      data: updated,
    });

    res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const streamCamera = async (req, res, next) => {
  try {
    const { camera_id } = req.params;
    const camera = dataStore.getCamera(camera_id);
    const streamServerPort = process.env.STREAM_SERVER_PORT || 8002;
    const streamServerHost = process.env.STREAM_SERVER_HOST || '127.0.0.1';

    let videoPathQuery = '';
    if (camera && (camera.stream_url || camera.streamUrl)) {
      videoPathQuery = `?video_path=${encodeURIComponent(camera.stream_url || camera.streamUrl)}`;
    }

    const aiStreamUrl = `http://${streamServerHost}:${streamServerPort}/api/v1/stream/${camera_id}${videoPathQuery}`;

    const httpModule = await import('http');
    const proxyReq = httpModule.default.get(aiStreamUrl, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, {
        ...(proxyRes.headers || {}),
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Connection': 'close',
      });
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.warn(`[STREAM-PROXY] AI live stream offline on port ${streamServerPort} (${err.message})`);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: 'AI_STREAM_UNAVAILABLE',
          message: `AI Stream Daemon offline on port ${streamServerPort}. Please ensure Traffix_Ai stream_server is running.`,
        });
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });
  } catch (error) {
    next(error);
  }
};

export default {
  listCameras,
  getCameraById,
  getCameraStatus,
  cameraHeartbeat,
  createCamera,
  deleteCamera,
  resetCameras,
  updateCameraDetails,
  streamCamera,
};
