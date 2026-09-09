import http from 'http';
import app from './src/app.js';
import { attachTrafficSocketServer } from './src/websocket/traffic.ws.js';
import WebSocket from 'ws';

async function runMultiCamTest() {
  console.log('========================================================');
  console.log('  TRAFFIX AI — MULTI-CAMERA RE-ID & TRAJECTORY TEST     ');
  console.log('========================================================');

  const server = http.createServer(app);
  attachTrafficSocketServer(server);

  await new Promise((resolve) => server.listen(8098, resolve));
  const baseUrl = 'http://127.0.0.1:8098';
  console.log(`[TEST] Server listening on ${baseUrl}`);

  try {
    // 1. Connect WebSocket client
    const wsReceived = [];
    const ws = new WebSocket('ws://127.0.0.1:8098/api/v1/ws/traffic');
    await new Promise((resolve) => ws.on('open', resolve));
    ws.on('message', (msg) => {
      try {
        wsReceived.push(JSON.parse(msg.toString()));
      } catch {}
    });
    console.log('[1/4] WebSocket client connected to /api/v1/ws/traffic');

    // 2. Trigger Camera A (Park Street Junction)
    console.log('\n[2/4] Triggering Camera A (Park Street Junction - CAM_001)...');
    const camARes = await fetch(`${baseUrl}/api/v1/simulation/play-camera`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camera_id: 'CAM_001', mode: 'simulated' }),
    });
    const camAData = await camARes.json();
    console.log('  -> Response:', camAData.data);

    // Wait for WS event
    await new Promise((resolve) => setTimeout(resolve, 300));
    const eventA = wsReceived.find((m) => m.data?.cameraId === 'CAM_001');
    console.log(`  -> WS Broadcast Received: Vehicle ${eventA?.data?.plateNumber} at ${eventA?.data?.cameraName}`);
    if (!eventA) throw new Error('Failed to receive Camera A WS broadcast');

    const vehicleId = eventA.data.vehicleId;
    const plateNumber = eventA.data.plateNumber;

    // 3. Trigger Camera B (Esplanade Crossing)
    console.log('\n[3/4] Triggering Camera B (Esplanade Crossing - CAM_002)...');
    const camBRes = await fetch(`${baseUrl}/api/v1/simulation/play-camera`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camera_id: 'CAM_002', mode: 'simulated' }),
    });
    const camBData = await camBRes.json();
    console.log('  -> Response:', camBData.data);

    // Wait for WS event
    await new Promise((resolve) => setTimeout(resolve, 300));
    const eventB = wsReceived.find((m) => m.data?.cameraId === 'CAM_002');
    console.log(`  -> WS Broadcast Received: Vehicle ${eventB?.data?.plateNumber} at ${eventB?.data?.cameraName}`);
    console.log(`  -> Matched By: ${eventB?.data?.matchedBy}`);
    console.log(`  -> Trajectory Points Count: ${eventB?.data?.trajectory?.detections?.length}`);

    if (!eventB) throw new Error('Failed to receive Camera B WS broadcast');
    if (eventB.data.trajectory?.detections?.length < 2) {
      throw new Error(`Expected trajectory length >= 2, got ${eventB.data.trajectory?.detections?.length}`);
    }

    // 4. Verify Vehicle Trajectory API
    console.log('\n[4/4] Verifying GET /api/v1/vehicles/:id/trajectory...');
    const trajRes = await fetch(`${baseUrl}/api/v1/vehicles/${encodeURIComponent(plateNumber)}/trajectory`);
    const trajData = await trajRes.json();
    console.log('  -> Trajectory Data Points:');
    trajData.data?.points?.forEach((pt, i) => {
      console.log(`     ${i + 1}. [${pt.camera_id}] ${pt.camera_name} (${pt.latitude}, ${pt.longitude}) at ${pt.timestamp}`);
    });

    if (trajData.data?.points?.length < 2) {
      throw new Error(`Trajectory has fewer than 2 points: ${trajData.data?.points?.length}`);
    }

    const firstPt = trajData.data.points[0];
    const secondPt = trajData.data.points[1];
    if (firstPt.camera_id !== 'CAM_001' || secondPt.camera_id !== 'CAM_002') {
      throw new Error(`Unexpected trajectory camera order: ${firstPt.camera_id} -> ${secondPt.camera_id}`);
    }

    ws.close();
    console.log('\n========================================================');
    console.log('🎉 MULTI-CAMERA RE-ID & TRAJECTORY TEST PASSED 100%!   ');
    console.log('   Route Created: Park Street Junction ➔ Esplanade Crossing');
    console.log('========================================================\n');
  } finally {
    server.close();
  }
}

runMultiCamTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
