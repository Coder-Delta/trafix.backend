import { WebSocketServer } from 'ws';

const clients = new Set();
const vehicleClients = new Map(); // vehicleId -> Set of ws clients

/**
 * Parses pathname from raw URL.
 */
const parseSocketPath = (url = '') => {
  const cleanUrl = url.split('?')[0];
  return cleanUrl || '/';
};

/**
 * Broadcasts an event payload to all connected clients on /api/v1/ws/traffic.
 */
export const broadcastTrafficEvent = (event) => {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    if (client.readyState === 1 /* OPEN */) {
      try {
        client.send(payload);
      } catch (err) {
        console.warn('[ws] Error sending to client:', err.message);
      }
    }
  }
};

/**
 * Broadcasts a vehicle-specific update.
 */
export const broadcastVehicleEvent = (vehicleId, event) => {
  const targetClients = vehicleClients.get(vehicleId);
  if (!targetClients) return;
  const payload = JSON.stringify(event);
  for (const client of targetClients) {
    if (client.readyState === 1 /* OPEN */) {
      try {
        client.send(payload);
      } catch {}
    }
  }
};

/**
 * Initializes and attaches the WebSocket server to the Node HTTP server.
 */
export const attachTrafficSocketServer = (server) => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const requestPath = parseSocketPath(req.url);

    // Route 1: General Traffic Stream
    if (requestPath === '/api/v1/ws/traffic' || requestPath === '/ws' || requestPath === '/') {
      clients.add(ws);

      // Send initial handshake
      ws.send(
        JSON.stringify({
          success: true,
          type: 'connection_established',
          data: {
            service: 'trafix-ai-backend',
            stream: 'kolkata-traffic-realtime',
            connected_at: new Date().toISOString(),
          },
        })
      );

      ws.on('message', (message) => {
        try {
          const parsed = JSON.parse(message.toString());
          if (parsed.type === 'ping') {
            ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          }
        } catch {}
      });

      ws.on('close', () => {
        clients.delete(ws);
      });

      ws.on('error', () => {
        clients.delete(ws);
      });
      return;
    }

    // Route 2: Vehicle-specific Tracking Stream
    const vehicleMatch = requestPath.match(/^\/api\/v1\/ws\/vehicle\/([^/]+)$/);
    if (vehicleMatch) {
      const vehicleId = vehicleMatch[1];
      if (!vehicleClients.has(vehicleId)) {
        vehicleClients.set(vehicleId, new Set());
      }
      vehicleClients.get(vehicleId).add(ws);

      ws.send(
        JSON.stringify({
          success: true,
          type: 'vehicle_connection_established',
          data: {
            vehicle_id: vehicleId,
            connected_at: new Date().toISOString(),
          },
        })
      );

      ws.on('close', () => {
        const set = vehicleClients.get(vehicleId);
        if (set) {
          set.delete(ws);
          if (set.size === 0) vehicleClients.delete(vehicleId);
        }
      });

      ws.on('error', () => {
        const set = vehicleClients.get(vehicleId);
        if (set) set.delete(ws);
      });
      return;
    }

    // Default route: allow connection as general client
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
    ws.on('error', () => clients.delete(ws));
  });

  console.log('[websocket] Real-time WebSocket server attached to HTTP server');
  return wss;
};

// Export attachVehicleSocketServer as no-op or alias for compatibility with server.js
export const attachVehicleSocketServer = () => {};

export default {
  attachTrafficSocketServer,
  attachVehicleSocketServer,
  broadcastTrafficEvent,
  broadcastVehicleEvent,
};
