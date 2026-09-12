import 'dotenv/config';
import http from 'http';
import app from './app.js';
import { initializeDatabase } from './config/database.js';
import { initializeRedis } from './config/redis.js';
import { dataStore } from './store/persistence.js';
import { attachTrafficSocketServer, attachVehicleSocketServer } from './websocket/traffic.ws.js';
import { ensureStreamDaemonRunning } from './controllers/camera.controller.js';

const port = Number(process.env.PORT || 8000);

const startServer = async () => {
  try {
    await initializeDatabase();
    await dataStore.init();
    await initializeRedis();

    // Auto-boot AI stream daemon in the background
    ensureStreamDaemonRunning().catch((err) => {
      console.warn('[SERVER] Could not auto-boot AI stream daemon:', err.message);
    });

    const server = http.createServer(app);

    attachTrafficSocketServer(server, '/api/v1/ws/traffic');
    attachVehicleSocketServer(server, '/api/v1/ws/vehicle/:vehicle_id');

    server.listen(port, () => {
      console.log(`Trafix AI backend listening on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
