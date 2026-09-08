import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createRequestContext } from './utils/requestContext.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import cameraRoutes from './routes/camera.routes.js';
import eventRoutes from './routes/event.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import trafficRoutes from './routes/traffic.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import { openApiSpec } from './config/swagger.js';

dotenv.config();

const app = express();

app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(createRequestContext);

const healthHandler = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'trafix-ai-backend',
      timestamp: new Date().toISOString(),
      request_id: req.id,
    },
  });
};

app.get('/health', healthHandler);
app.get('/api/v1/health', healthHandler);

app.get('/api/v1/openapi', (req, res) => {
  res.status(200).json({
    success: true,
    data: openApiSpec,
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/cameras', cameraRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/vehicles', vehicleRoutes);
app.use('/api/v1/traffic', trafficRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
