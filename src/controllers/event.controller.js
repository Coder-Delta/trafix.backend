import { HttpError } from '../utils/httpError.js';

const nowIso = () => new Date().toISOString();

const detectionEventShape = {
  event_id: 'evt_123',
  camera_id: 'cam_001',
  observed_at: nowIso(),
  local_track_id: 'track_123',
  vehicle_type: 'car',
  plate_number: 'ABC123',
  plate_confidence: 0.98,
  vehicle_embedding: 'base64-placeholder',
  embedding_model: 'yolov8',
  embedding_version: 'v1',
  vehicle_confidence: 0.95,
  bounding_box: { x1: 10, y1: 20, x2: 200, y2: 180 },
  frame_reference: 'frame_001.jpg',
};

export const createDetectionEvent = async (req, res, next) => {
  try {
    const payload = req.body || {};

    if (!payload.event_id || !payload.camera_id || !payload.observed_at || !payload.local_track_id) {
      throw new HttpError('VALIDATION_ERROR', 'Detection event is missing required fields.', 400);
    }

    res.status(202).json({
      success: true,
      data: {
        accepted: true,
        event_id: payload.event_id,
        camera_id: payload.camera_id,
        observed_at: payload.observed_at,
      },
      message: 'TODO: persist detection event and enqueue processing',
    });
  } catch (error) {
    next(error);
  }
};

export const createBatchDetectionEvents = async (req, res, next) => {
  try {
    const events = Array.isArray(req.body?.events) ? req.body.events : [];

    if (!events.length) {
      throw new HttpError('VALIDATION_ERROR', 'Request body must include an events array.', 400);
    }

    res.status(202).json({
      success: true,
      data: {
        accepted: events.length,
        event_ids: events.map((event) => event.event_id || 'pending'),
      },
      message: 'TODO: validate and persist batched detection events',
    });
  } catch (error) {
    next(error);
  }
};

export const detectionEventContract = () => detectionEventShape;

export default { createDetectionEvent, createBatchDetectionEvents, detectionEventContract };
