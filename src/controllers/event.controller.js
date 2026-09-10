import { HttpError } from '../utils/httpError.js';
import { identityService } from '../services/identity.service.js';
import { dataStore } from '../store/persistence.js';
import { broadcastTrafficEvent } from '../websocket/traffic.ws.js';

export const createDetectionEvent = async (req, res, next) => {
  try {
    const payload = req.body || {};

    if (!payload.camera_id || !payload.observed_at) {
      throw new HttpError('VALIDATION_ERROR', 'camera_id and observed_at are required fields.', 400);
    }

    const eventId = payload.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const eventData = { ...payload, event_id: eventId };

    // 1. Resolve Global Vehicle Identity (Re-ID / Plate / New)
    const { vehicle, isNew, matchedBy, anomalyAlert } = await identityService.resolveIdentity(eventData);

    // 2. Persist Detection Event
    dataStore.saveDetection({
      event_id: eventId,
      vehicle_id: vehicle.vehicle_id,
      camera_id: payload.camera_id,
      observed_at: payload.observed_at,
      vehicle_type: vehicle.vehicle_type,
      plate_number: vehicle.plate_number,
      vehicle_confidence: payload.vehicle_confidence || 0.95,
      bounding_box: payload.bounding_box || { x1: 0, y1: 0, x2: 100, y2: 100 },
      vehicle_embedding: payload.vehicle_embedding,
      frame_reference: payload.frame_reference,
    });

    const camera = dataStore.getCamera(payload.camera_id);
    const trajectory = dataStore.getVehicleTrajectory(vehicle.vehicle_id);

    // 3. Broadcast Real-Time Vehicle Detection via WebSocket
    broadcastTrafficEvent({
      id: eventId,
      type: 'vehicle_detection',
      timestamp: payload.observed_at,
      data: {
        vehicleId: vehicle.vehicle_id,
        plateNumber: vehicle.plate_number,
        vehicleType: vehicle.vehicle_type,
        color: vehicle.color || 'Silver',
        cameraId: payload.camera_id,
        cameraName: camera?.name || payload.camera_id,
        latitude: camera?.latitude || 22.5535,
        longitude: camera?.longitude || 88.3525,
        confidence: payload.vehicle_confidence || 0.95,
        boundingBox: payload.bounding_box || null,
        localTrackId: payload.local_track_id || null,
        plateConfidence: payload.plate_confidence || null,
        speed: Math.floor(35 + Math.random() * 25),
        timestamp: payload.observed_at,
        matchedBy: matchedBy,
        isNew: isNew,
        trajectory: trajectory && trajectory.points?.length > 0 ? {
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
      },
    });

    // 4. If Anomaly or Hotlist Alert detected, broadcast immediately
    if (anomalyAlert) {
      broadcastTrafficEvent({
        id: anomalyAlert.id,
        type: 'security_alert',
        timestamp: anomalyAlert.timestamp,
        data: anomalyAlert,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        accepted: true,
        event_id: eventId,
        vehicle_id: vehicle.vehicle_id,
        plate_number: vehicle.plate_number,
        camera_id: payload.camera_id,
        observed_at: payload.observed_at,
        is_new_vehicle: isNew,
        matched_by: matchedBy,
      },
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

    const processed = [];
    for (const event of events) {
      const eventId = event.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const { vehicle } = await identityService.resolveIdentity({ ...event, event_id: eventId });

      dataStore.saveDetection({
        event_id: eventId,
        vehicle_id: vehicle.vehicle_id,
        camera_id: event.camera_id,
        observed_at: event.observed_at,
        vehicle_type: vehicle.vehicle_type,
        plate_number: vehicle.plate_number,
        vehicle_confidence: event.vehicle_confidence || 0.95,
        bounding_box: event.bounding_box || { x1: 0, y1: 0, x2: 100, y2: 100 },
      });

      processed.push({
        event_id: eventId,
        vehicle_id: vehicle.vehicle_id,
        plate_number: vehicle.plate_number,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        accepted: processed.length,
        events: processed,
      },
    });
  } catch (error) {
    next(error);
  }
};

export default { createDetectionEvent, createBatchDetectionEvents };
