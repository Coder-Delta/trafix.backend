import express from 'express';
import { createDetectionEvent, createBatchDetectionEvents } from '../controllers/event.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { publicAccess, requireOperator } from '../middleware/auth.middleware.js';

const detectionEventSchema = {
  validate: (payload) => {
    const body = payload || {};
    if (!body.local_track_id) {
      body.local_track_id = `${body.camera_id || 'CAM'}_TRK_${Date.now()}`;
    }

    const requiredFields = [
      'camera_id',
      'observed_at',
      'local_track_id',
    ];

    const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
    if (missing.length) {
      const error = new Error('Detection event validation failed');
      error.details = missing.map((field) => ({ path: [field], message: `${field} is required` }));
      error.name = 'ValidationError';
      return { error, value: body };
    }

    if (body.plate_confidence !== undefined && body.plate_confidence !== null) {
      if (typeof body.plate_confidence !== 'number' || body.plate_confidence < 0 || body.plate_confidence > 1) {
        const error = new Error('plate_confidence must be between 0.0 and 1.0');
        error.details = [{ path: ['plate_confidence'], message: 'plate_confidence must be between 0.0 and 1.0' }];
        error.name = 'ValidationError';
        return { error, value: body };
      }
    }

    if (body.vehicle_confidence !== undefined && body.vehicle_confidence !== null) {
      if (typeof body.vehicle_confidence !== 'number' || body.vehicle_confidence < 0 || body.vehicle_confidence > 1) {
        const error = new Error('vehicle_confidence must be between 0.0 and 1.0');
        error.details = [{ path: ['vehicle_confidence'], message: 'vehicle_confidence must be between 0.0 and 1.0' }];
        error.name = 'ValidationError';
        return { error, value: body };
      }
    }

    if (body.bounding_box) {
      const bbox = body.bounding_box || {};
      const bboxFields = ['x1', 'y1', 'x2', 'y2'];
      const missingBBox = bboxFields.filter((field) => bbox[field] === undefined || bbox[field] === null);
      if (missingBBox.length) {
        const error = new Error('bounding_box requires x1, y1, x2, y2');
        error.details = missingBBox.map((field) => ({ path: ['bounding_box', field], message: `${field} is required` }));
        error.name = 'ValidationError';
        return { error, value: body };
      }
    }

    return { value: body, error: null };
  },
};

const batchEventSchema = {
  validate: (payload) => {
    const body = payload || {};
    const events = Array.isArray(body.events) ? body.events : [];
    if (!events.length) {
      const error = new Error('events array is required');
      error.details = [{ path: ['events'], message: 'events array is required' }];
      error.name = 'ValidationError';
      return { error, value: body };
    }
    return { value: body, error: null };
  },
};

const router = express.Router();

router.post('/detection', publicAccess, validate(detectionEventSchema), createDetectionEvent);
router.post('/batch', publicAccess, validate(batchEventSchema), createBatchDetectionEvents);

export default router;
