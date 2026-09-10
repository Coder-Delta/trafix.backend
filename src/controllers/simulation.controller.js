import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { identityService } from '../services/identity.service.js';
import { dataStore } from '../store/persistence.js';
import { broadcastTrafficEvent } from '../websocket/traffic.ws.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pre-computed normalized 512D visual embeddings for sample vehicles
const SAMPLE_EMBEDDINGS = {
  'Car A': new Array(512).fill(0).map((_, i) => Math.sin(i * 0.12) / Math.sqrt(256)),
  'Car B': new Array(512).fill(0).map((_, i) => Math.cos(i * 0.15) / Math.sqrt(256)),
  'Bus C': new Array(512).fill(0).map((_, i) => Math.sin(i * 0.22) / Math.sqrt(256)),
};

let activeProcess = null;

export const playCameraDetection = async (req, res, next) => {
  try {
    const { camera_id = 'CAM_001', mode = 'auto', max_frames = 60 } = req.body || {};
    const camera = dataStore.getCamera(camera_id);

    if (!camera) {
      return res.status(404).json({ success: false, message: `Camera ${camera_id} not found` });
    }

    const aiRootDir = path.resolve(__dirname, '../../../Traffix_Ai');
    const frontendVideosDir = path.resolve(__dirname, '../../../TraffixAI-F/public/videos');
    const pythonExe = path.join(aiRootDir, 'venv/bin/python');
    const mainPy = path.join(aiRootDir, 'main.py');

    // Dynamically resolve video from camera.stream_url or custom video
    let videoPath = path.join(aiRootDir, 'data/videos/215258_medium.mp4');
    if (camera.stream_url) {
      const url = camera.stream_url.trim();
      const filename = path.basename(url.split('?')[0]);
      const possiblePaths = [
        url,
        path.join(aiRootDir, 'data/videos', filename),
        path.join(frontendVideosDir, filename),
        path.join(aiRootDir, 'data/videos', url),
        path.join(frontendVideosDir, url),
      ];

      for (const p of possiblePaths) {
        try {
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            videoPath = p;
            break;
          }
        } catch {
          // Ignore invalid path syntax
        }
      }
    }

    const canRunPython = fs.existsSync(pythonExe) && fs.existsSync(mainPy) && fs.existsSync(videoPath);

    // 1. First check if Traffix_Ai Standby Daemon is running on port 8002
    try {
      const daemonCheck = await fetch('http://localhost:8002/status', { signal: AbortSignal.timeout(600) });
      if (daemonCheck.ok) {
        console.log(`[SIMULATION] Waking up Traffix_Ai Standby Daemon (port 8002) for ${camera_id}...`);
        fetch('http://localhost:8002/api/v1/detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            camera_id,
            video_source: videoPath,
            backend_url: `http://localhost:${process.env.PORT || 8000}`,
            max_frames,
          }),
        }).catch((err) => console.warn(`[SIMULATION] Daemon call error: ${err.message}`));

        return res.status(200).json({
          success: true,
          data: {
            started: true,
            mode: 'ai_daemon',
            camera_id,
            camera_name: camera.name,
            message: `Traffix_Ai Standby Daemon awakened for ${camera.name}`,
          },
        });
      }
    } catch {
      // Daemon not running, fall back to direct child process spawn
    }

    if (mode === 'ai' || (mode === 'auto' && canRunPython)) {
      // Spawn actual Python AI pipeline with YOLOv8 + BoT-SORT + MobileNetV3 Re-ID
      console.log(`[SIMULATION] Spawning Python AI Service for ${camera_id} with video ${path.basename(videoPath)}...`);
      
      const port = process.env.PORT || 8000;
      const child = spawn(pythonExe, [
        mainPy,
        '--camera-id', camera_id,
        '--video', videoPath,
        '--backend-url', `http://localhost:${port}`,
        '--headless',
        '--max-frames', String(max_frames)
      ], {
        cwd: aiRootDir,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      child.stdout.on('data', (d) => {
        const text = d.toString().trim();
        if (text) console.log(`[AI-PROC] ${text}`);
      });

      child.stderr.on('data', (d) => {
        const text = d.toString().trim();
        if (text && !text.includes('UserWarning') && !text.includes('deprecated')) {
          console.warn(`[AI-PROC-ERR] ${text}`);
        }
      });

      child.on('close', (code) => {
        console.log(`[AI-PROC] Python AI pipeline for ${camera_id} finished with code ${code}`);
      });

      activeProcess = child;

      return res.status(200).json({
        success: true,
        data: {
          started: true,
          mode: 'ai_pipeline',
          camera_id,
          camera_name: camera.name,
          message: `AI YOLO+Re-ID pipeline running for ${camera.name}`,
        }
      });
    }

    // High-fidelity fallback / simulated playback
    console.log(`[SIMULATION] Running direct Re-ID simulation for ${camera_id}...`);
    const simVehicle = {
      name: 'Car A',
      plate: 'WB-02-T-1',
      type: 'car',
      embedding: SAMPLE_EMBEDDINGS['Car A'],
    };

    const eventId = `evt_sim_${Date.now()}`;
    const observedAt = new Date().toISOString();

    const { vehicle, isNew, matchedBy } = await identityService.resolveIdentity({
      camera_id,
      observed_at: observedAt,
      local_track_id: `${camera_id}_T_1`,
      vehicle_type: simVehicle.type,
      plate_number: simVehicle.plate,
      vehicle_embedding: simVehicle.embedding,
      vehicle_confidence: 0.96,
      bounding_box: { x1: 120, y1: 140, x2: 280, y2: 320 }
    });

    dataStore.saveDetection({
      event_id: eventId,
      vehicle_id: vehicle.vehicle_id,
      camera_id,
      observed_at: observedAt,
      vehicle_type: vehicle.vehicle_type,
      plate_number: vehicle.plate_number,
      vehicle_confidence: 0.96,
      bounding_box: { x1: 120, y1: 140, x2: 280, y2: 320 },
      vehicle_embedding: simVehicle.embedding,
    });

    const trajectory = dataStore.getVehicleTrajectory(vehicle.vehicle_id);

    broadcastTrafficEvent({
      id: eventId,
      type: 'vehicle_detection',
      timestamp: observedAt,
      data: {
        vehicleId: vehicle.vehicle_id,
        plateNumber: vehicle.plate_number,
        vehicleType: vehicle.vehicle_type,
        color: 'Silver',
        cameraId: camera_id,
        cameraName: camera.name,
        latitude: camera.latitude,
        longitude: camera.longitude,
        confidence: 0.96,
        speed: 48,
        timestamp: observedAt,
        matchedBy,
        isNew,
        trajectory: trajectory ? {
          vehicleId: trajectory.vehicle_id,
          plateNumber: trajectory.plate_number,
          vehicleType: trajectory.vehicle_type,
          detections: trajectory.points.map((pt, idx) => ({
            id: pt.event_id || `DET_${idx + 1}`,
            cameraId: pt.camera_id,
            cameraName: pt.camera_name,
            latitude: pt.latitude,
            longitude: pt.longitude,
            detectedAt: pt.timestamp,
          })),
        } : null,
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        started: true,
        mode: 'direct_simulation',
        camera_id,
        camera_name: camera.name,
        vehicle_id: vehicle.vehicle_id,
        plate_number: vehicle.plate_number,
        matched_by: matchedBy,
        trajectory_points: trajectory?.points?.length || 1,
      }
    });
  } catch (error) {
    next(error);
  }
};

export default { playCameraDetection };
