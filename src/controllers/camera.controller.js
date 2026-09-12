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

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let streamDaemonProc = null;

export const ensureStreamDaemonRunning = async () => {
  const streamServerPort = process.env.STREAM_SERVER_PORT || 8002;
  const streamServerHost = process.env.STREAM_SERVER_HOST || '127.0.0.1';

  try {
    const res = await fetch(`http://${streamServerHost}:${streamServerPort}/health`, { signal: AbortSignal.timeout(400) });
    if (res.ok) return true;
  } catch {}

  const aiRootDir = path.resolve(__dirname, '../../../Traffix_Ai');
  const pythonExe = path.join(aiRootDir, 'venv/bin/python');
  const streamServerPy = path.join(aiRootDir, 'server/stream_server.py');

  if (fs.existsSync(pythonExe) && fs.existsSync(streamServerPy)) {
    console.log('[STREAM-CONTROLLER] Launching Traffix_Ai stream daemon on port 8002...');
    streamDaemonProc = spawn(pythonExe, [streamServerPy], {
      cwd: aiRootDir,
      detached: false,
      stdio: 'ignore',
    });

    for (let i = 0; i < 25; i++) {
      await new Promise((r) => setTimeout(r, 250));
      try {
        const check = await fetch(`http://${streamServerHost}:${streamServerPort}/health`, { signal: AbortSignal.timeout(300) });
        if (check.ok) {
          console.log('[STREAM-CONTROLLER] Traffix_Ai stream daemon successfully started on port 8002.');
          return true;
        }
      } catch {}
    }
  }
  return false;
};

export const streamCamera = async (req, res, next) => {
  try {
    const { camera_id } = req.params;
    const camera = dataStore.getCamera(camera_id);
    const streamServerPort = process.env.STREAM_SERVER_PORT || 8002;
    const streamServerHost = process.env.STREAM_SERVER_HOST || '127.0.0.1';

    await ensureStreamDaemonRunning();

    let videoPathQuery = '';
    if (camera && (camera.stream_url || camera.streamUrl)) {
      videoPathQuery = `?video_path=${encodeURIComponent(camera.stream_url || camera.streamUrl)}`;
    }

    const aiStreamUrl = `http://${streamServerHost}:${streamServerPort}/api/v1/stream/${camera_id}${videoPathQuery}`;

    const httpModule = await import('http');
    const proxyReq = httpModule.default.get(aiStreamUrl, (proxyRes) => {
      res.setHeader('Content-Type', 'multipart/x-mixed-replace; boundary=frame');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Connection', 'close');
      res.writeHead(proxyRes.statusCode || 200);

      proxyRes.on('data', (chunk) => {
        res.write(chunk);
      });
      proxyRes.on('end', () => {
        res.end();
      });
    });

    proxyReq.on('error', (err) => {
      console.warn(`[STREAM-PROXY] AI live stream error (${err.message})`);
      if (!res.headersSent) {
        res.status(503).json({
          success: false,
          error: 'AI_STREAM_UNAVAILABLE',
          message: `AI Stream Daemon offline on port ${streamServerPort}.`,
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

export const listAvailableVideos = async (req, res, next) => {
  try {
    const frontendVideosDir = path.resolve(__dirname, '../../../TraffixAI-F/public/videos');
    const aiVideosDir = path.resolve(__dirname, '../../../Traffix_Ai/data/videos');

    const videoMap = new Map();
    const videoExts = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm']);

    const scanDir = (dirPath) => {
      if (fs.existsSync(dirPath)) {
        try {
          const files = fs.readdirSync(dirPath);
          for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            if (videoExts.has(ext)) {
              const filePath = path.join(dirPath, file);
              const stat = fs.statSync(filePath);
              if (!videoMap.has(file)) {
                videoMap.set(file, {
                  id: file,
                  filename: file,
                  name: file.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, ''),
                  path: `/videos/${file}`,
                  sizeBytes: stat.size,
                  sizeFormatted: `${(stat.size / (1024 * 1024)).toFixed(1)} MB`,
                });
              }
            }
          }
        } catch {}
      }
    };

    scanDir(frontendVideosDir);
    scanDir(aiVideosDir);

    const videos = Array.from(videoMap.values());

    res.status(200).json({
      success: true,
      data: {
        videos,
        total: videos.length,
      },
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
  listAvailableVideos,
};
