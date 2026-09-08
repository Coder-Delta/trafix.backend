import http from 'http';
import app from './src/app.js';
import { attachTrafficSocketServer } from './src/websocket/traffic.ws.js';
import WebSocket from 'ws';

async function runTests() {
  console.log('--- Starting Backend Verification Suite ---');

  const server = http.createServer(app);
  attachTrafficSocketServer(server);

  await new Promise((resolve) => server.listen(8099, resolve));
  const baseUrl = 'http://127.0.0.1:8099';
  console.log(`[TEST] Server listening on ${baseUrl}`);

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/v1/health`);
    const healthJson = await healthRes.json();
    console.log('[TEST 1] GET /api/v1/health ->', healthRes.status, healthJson.data?.status);
    if (healthRes.status !== 200) throw new Error('Health check failed');

    // 2. Camera list
    const camRes = await fetch(`${baseUrl}/api/v1/cameras`);
    const camJson = await camRes.json();
    console.log('[TEST 2] GET /api/v1/cameras ->', camRes.status, `found ${camJson.data?.cameras?.length} cameras`);
    if (camJson.data?.cameras?.length !== 5) throw new Error('Expected 5 Kolkata cameras');

    // 3. Camera heartbeat
    const hbRes = await fetch(`${baseUrl}/api/v1/cameras/CAM_001/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'online', fps: 29.5, processing_latency_ms: 22 }),
    });
    const hbJson = await hbRes.json();
    console.log('[TEST 3] POST /api/v1/cameras/CAM_001/heartbeat ->', hbRes.status, hbJson.data?.fps);
    if (hbRes.status !== 200) throw new Error('Camera heartbeat failed');

    // 4. WebSocket connection
    const wsReceived = [];
    const ws = new WebSocket('ws://127.0.0.1:8099/api/v1/ws/traffic');
    await new Promise((resolve) => {
      ws.on('open', resolve);
    });
    ws.on('message', (msg) => {
      wsReceived.push(JSON.parse(msg.toString()));
    });
    console.log('[TEST 4] WS /api/v1/ws/traffic connected');

    // 5. Ingest Detection Event (with plate & embedding)
    const mockEmbedding = new Array(512).fill(0.044); // normalized mock embedding
    const detectPayload = {
      event_id: 'evt_test_001',
      camera_id: 'CAM_001',
      observed_at: new Date().toISOString(),
      local_track_id: 'trk_999',
      vehicle_type: 'car',
      plate_number: 'WB12AB1234',
      plate_confidence: 0.98,
      vehicle_confidence: 0.96,
      vehicle_embedding: mockEmbedding,
      bounding_box: { x1: 100, y1: 150, x2: 300, y2: 350 },
    };

    const detectRes = await fetch(`${baseUrl}/api/v1/events/detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(detectPayload),
    });
    const detectJson = await detectRes.json();
    console.log('[TEST 5] POST /api/v1/events/detection ->', detectRes.status, detectJson.data);
    if (detectRes.status !== 201) throw new Error('Detection ingestion failed');

    // Wait for WS broadcast
    await new Promise((resolve) => setTimeout(resolve, 200));
    const vehicleBroadcast = wsReceived.find((m) => m.type === 'vehicle_detection');
    console.log('[TEST 6] WS Received broadcast:', vehicleBroadcast?.data?.plateNumber, vehicleBroadcast?.data?.cameraName);
    if (!vehicleBroadcast) throw new Error('WebSocket broadcast not received');

    // 7. Vehicle Search
    const searchRes = await fetch(`${baseUrl}/api/v1/vehicles/search?plate_number=WB12AB1234`);
    const searchJson = await searchRes.json();
    console.log('[TEST 7] GET /api/v1/vehicles/search ->', searchRes.status, `found ${searchJson.data?.vehicles?.length} vehicles`);
    if (searchJson.data?.vehicles?.length === 0) throw new Error('Vehicle search failed');

    // 8. Vehicle Trajectory
    const trajRes = await fetch(`${baseUrl}/api/v1/vehicles/WB12AB1234/trajectory`);
    const trajJson = await trajRes.json();
    console.log('[TEST 8] GET /api/v1/vehicles/WB12AB1234/trajectory ->', trajRes.status, `points: ${trajJson.data?.points?.length}`);
    if (trajJson.data?.points?.length === 0) throw new Error('Vehicle trajectory empty');

    // 9. Analytics Overview & Alerts
    const anaRes = await fetch(`${baseUrl}/api/v1/analytics/overview`);
    const anaJson = await anaRes.json();
    console.log('[TEST 9] GET /api/v1/analytics/overview ->', anaRes.status, `total: ${anaJson.data?.total_vehicles}, congestion: ${anaJson.data?.congestion_level}`);

    const altRes = await fetch(`${baseUrl}/api/v1/analytics/alerts`);
    const altJson = await altRes.json();
    console.log('[TEST 10] GET /api/v1/analytics/alerts ->', altRes.status, `alerts: ${altJson.data?.alerts?.length}`);

    // 10. Re-ID Appearance Matching Test (vehicle without plate, matching via 512D embedding)
    const reidPayload = {
      event_id: 'evt_test_reid',
      camera_id: 'CAM_002',
      observed_at: new Date().toISOString(),
      local_track_id: 'trk_unplated_1',
      vehicle_type: 'car',
      plate_number: null,
      vehicle_confidence: 0.94,
      vehicle_embedding: mockEmbedding, // same embedding as WB12AB1234
      bounding_box: { x1: 50, y1: 50, x2: 250, y2: 250 },
    };
    const reidRes = await fetch(`${baseUrl}/api/v1/events/detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reidPayload),
    });
    const reidJson = await reidRes.json();
    console.log('[TEST 11] Re-ID Match without plate -> matched_by:', reidJson.data?.matched_by, 'vehicle_id:', reidJson.data?.vehicle_id);
    if (reidJson.data?.matched_by !== 'embedding') {
      throw new Error(`Expected matched_by 'embedding', got '${reidJson.data?.matched_by}'`);
    }

    ws.close();
    console.log('\n>>> ALL 11 BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY! <<<');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
