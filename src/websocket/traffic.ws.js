import { WebSocketServer } from 'ws';

const parseSocketPath = (url = '') => {
  const cleanUrl = url.split('?')[0];
  return cleanUrl || '/';
};

export const attachTrafficSocketServer = (server, path = '/api/v1/ws/traffic') => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const requestPath = parseSocketPath(req.url);
    if (requestPath !== path) {
      ws.close(1008, 'Invalid WebSocket route');
      return;
    }

    ws.send(JSON.stringify({
      success: true,
      type: 'connection_established',
      data: {
        message: 'TODO: attach traffic stream subscriptions and auth checks',
        path: requestPath,
      },
    }));

    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message.toString());
        ws.send(JSON.stringify({
          success: true,
          type: 'message_received',
          data: {
            payload: parsed,
            note: 'TODO: implement websocket traffic stream routing and event fanout',
          },
        }));
      } catch (error) {
        ws.send(JSON.stringify({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Incoming websocket message must be valid JSON.',
          },
        }));
      }
    });
  });

  return wss;
};

export const attachVehicleSocketServer = (server, pathPrefix = '/api/v1/ws/vehicle') => {
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws, req) => {
    const requestPath = parseSocketPath(req.url);
    const match = requestPath.match(/^\/api\/v1\/ws\/vehicle\/([^/]+)$/);

    if (!match) {
      ws.close(1008, 'Invalid vehicle WebSocket route');
      return;
    }

    const vehicleId = match[1];
    ws.send(JSON.stringify({
      success: true,
      type: 'vehicle_connection_established',
      data: {
        vehicle_id: vehicleId,
        path: requestPath,
        message: 'TODO: implement vehicle-specific realtime updates and auth checks',
      },
    }));
  });

  return wss;
};

export default { attachTrafficSocketServer, attachVehicleSocketServer };
