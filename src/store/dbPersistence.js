import { getDatabasePool } from '../config/database.js';

export const createTables = async (pool) => {
  if (!pool) return;
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS cameras (
        camera_id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        latitude DOUBLE PRECISION NOT NULL,
        longitude DOUBLE PRECISION NOT NULL,
        direction VARCHAR(100),
        status VARCHAR(50) DEFAULT 'online',
        fps INTEGER DEFAULT 25,
        vehicle_count INTEGER DEFAULT 0,
        traffic_level VARCHAR(50) DEFAULT 'low',
        stream_url TEXT,
        detected_vehicles JSONB DEFAULT '{}',
        last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        vehicle_id VARCHAR(100) PRIMARY KEY,
        plate_number VARCHAR(100),
        vehicle_type VARCHAR(50),
        color VARCHAR(50),
        confidence DOUBLE PRECISION,
        embedding JSONB,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        camera_id VARCHAR(50),
        camera_name VARCHAR(255),
        speed INTEGER,
        first_seen_at TIMESTAMPTZ,
        last_seen_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS detections (
        event_id VARCHAR(100) PRIMARY KEY,
        vehicle_id VARCHAR(100),
        plate_number VARCHAR(100),
        camera_id VARCHAR(50),
        camera_name VARCHAR(255),
        observed_at TIMESTAMPTZ,
        vehicle_type VARCHAR(50),
        color VARCHAR(50),
        confidence DOUBLE PRECISION,
        bounding_box JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS alerts (
        alert_id VARCHAR(100) PRIMARY KEY,
        type VARCHAR(100),
        vehicle_id VARCHAR(100),
        plate_number VARCHAR(100),
        camera_id VARCHAR(50),
        timestamp TIMESTAMPTZ,
        details JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('[dbPersistence] PostgreSQL tables verified / created successfully');
  } finally {
    client.release();
  }
};

export const loadCamerasFromDb = async (pool) => {
  if (!pool) return [];
  const { rows } = await pool.query('SELECT * FROM cameras ORDER BY camera_id ASC');
  return rows.map((r) => ({
    camera_id: r.camera_id,
    id: r.camera_id,
    name: r.name,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    location: { lat: Number(r.latitude), lng: Number(r.longitude) },
    direction: r.direction || 'Northbound',
    status: r.status || 'online',
    fps: Number(r.fps || 25),
    vehicle_count: Number(r.vehicle_count || 0),
    vehicleCount: Number(r.vehicle_count || 0),
    traffic_level: r.traffic_level || 'low',
    trafficLevel: r.traffic_level || 'low',
    stream_url: r.stream_url || '/videos/sample_traffic.mp4',
    detected_vehicles: r.detected_vehicles || { car: 0, motorcycle: 0, bus: 0, truck: 0, van: 0, taxi: 0 },
    detectedVehicles: r.detected_vehicles || { car: 0, motorcycle: 0, bus: 0, truck: 0, van: 0, taxi: 0 },
    last_heartbeat: r.last_heartbeat ? new Date(r.last_heartbeat).toISOString() : new Date().toISOString(),
  }));
};

export const seedCamerasToDb = async (pool, initialCameras) => {
  if (!pool) return;
  for (const c of initialCameras) {
    await pool.query(
      `INSERT INTO cameras (camera_id, name, latitude, longitude, direction, status, fps, vehicle_count, traffic_level, stream_url, detected_vehicles)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (camera_id) DO NOTHING`,
      [
        c.camera_id || c.id,
        c.name,
        c.latitude,
        c.longitude,
        c.direction || 'Northbound',
        c.status || 'online',
        c.fps || 25,
        0,
        c.traffic_level || 'low',
        c.stream_url || '/videos/sample_traffic.mp4',
        JSON.stringify(c.detected_vehicles || {}),
      ]
    );
  }
};

export const saveCameraToDb = async (pool, camera) => {
  if (!pool) return;
  await pool.query(
    `INSERT INTO cameras (camera_id, name, latitude, longitude, direction, status, fps, vehicle_count, traffic_level, stream_url, detected_vehicles)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     ON CONFLICT (camera_id) DO UPDATE SET
       name = EXCLUDED.name,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       direction = EXCLUDED.direction,
       status = EXCLUDED.status,
       fps = EXCLUDED.fps,
       stream_url = EXCLUDED.stream_url,
       updated_at = NOW()`,
    [
      camera.camera_id || camera.id,
      camera.name,
      camera.latitude,
      camera.longitude,
      camera.direction || 'Northbound',
      camera.status || 'online',
      camera.fps || 25,
      camera.vehicle_count || 0,
      camera.traffic_level || 'low',
      camera.stream_url || '/videos/sample_traffic.mp4',
      JSON.stringify(camera.detected_vehicles || {}),
    ]
  );
};

export const updateCameraInDb = async (pool, cameraId, updateData) => {
  if (!pool) return;
  const sets = [];
  const vals = [cameraId];
  let idx = 2;

  for (const [key, val] of Object.entries(updateData)) {
    if (['name', 'status', 'direction', 'stream_url', 'traffic_level'].includes(key)) {
      sets.push(`${key} = $${idx++}`);
      vals.push(val);
    } else if (key === 'latitude' || key === 'longitude' || key === 'fps' || key === 'vehicle_count') {
      sets.push(`${key} = $${idx++}`);
      vals.push(Number(val));
    } else if (key === 'detected_vehicles') {
      sets.push(`detected_vehicles = $${idx++}`);
      vals.push(JSON.stringify(val));
    }
  }

  if (sets.length > 0) {
    sets.push(`updated_at = NOW()`);
    await pool.query(`UPDATE cameras SET ${sets.join(', ')} WHERE camera_id = $1`, vals);
  }
};

export const deleteCameraFromDb = async (pool, cameraId) => {
  if (!pool) return;
  await pool.query('DELETE FROM cameras WHERE camera_id = $1', [cameraId]);
};

export const loadVehiclesFromDb = async (pool) => {
  if (!pool) return [];
  const { rows } = await pool.query('SELECT * FROM vehicles ORDER BY last_seen_at DESC');
  return rows.map((r) => ({
    vehicle_id: r.vehicle_id,
    id: r.vehicle_id,
    plate_number: r.plate_number,
    plateNumber: r.plate_number,
    vehicle_type: r.vehicle_type,
    vehicleType: r.vehicle_type,
    color: r.color,
    confidence: Number(r.confidence || 0.95),
    embedding: r.embedding,
    latitude: Number(r.latitude || 22.5535),
    longitude: Number(r.longitude || 88.3525),
    camera_id: r.camera_id,
    cameraId: r.camera_id,
    camera_name: r.camera_name,
    cameraName: r.camera_name,
    speed: Number(r.speed || 45),
    first_seen_at: r.first_seen_at ? new Date(r.first_seen_at).toISOString() : null,
    last_seen_at: r.last_seen_at ? new Date(r.last_seen_at).toISOString() : null,
  }));
};

export const saveVehicleToDb = async (pool, vehicle) => {
  if (!pool) return;
  const vid = vehicle.vehicle_id || vehicle.id;
  await pool.query(
    `INSERT INTO vehicles (vehicle_id, plate_number, vehicle_type, color, confidence, embedding, latitude, longitude, camera_id, camera_name, speed, first_seen_at, last_seen_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
     ON CONFLICT (vehicle_id) DO UPDATE SET
       plate_number = EXCLUDED.plate_number,
       vehicle_type = EXCLUDED.vehicle_type,
       color = EXCLUDED.color,
       latitude = EXCLUDED.latitude,
       longitude = EXCLUDED.longitude,
       camera_id = EXCLUDED.camera_id,
       camera_name = EXCLUDED.camera_name,
       speed = EXCLUDED.speed,
       last_seen_at = EXCLUDED.last_seen_at`,
    [
      vid,
      vehicle.plate_number || vehicle.plateNumber,
      vehicle.vehicle_type || vehicle.vehicleType || 'car',
      vehicle.color || 'White',
      vehicle.confidence || 0.95,
      JSON.stringify(vehicle.embedding || null),
      vehicle.latitude || 22.5535,
      vehicle.longitude || 88.3525,
      vehicle.camera_id || vehicle.cameraId,
      vehicle.camera_name || vehicle.cameraName,
      vehicle.speed || 45,
      vehicle.first_seen_at || vehicle.detected_at || new Date().toISOString(),
      vehicle.last_seen_at || vehicle.detected_at || new Date().toISOString(),
    ]
  );
};

export const loadDetectionsFromDb = async (pool) => {
  if (!pool) return [];
  const { rows } = await pool.query('SELECT * FROM detections ORDER BY observed_at ASC');
  return rows.map((r) => ({
    event_id: r.event_id,
    vehicle_id: r.vehicle_id,
    plate_number: r.plate_number,
    camera_id: r.camera_id,
    camera_name: r.camera_name,
    observed_at: r.observed_at ? new Date(r.observed_at).toISOString() : new Date().toISOString(),
    vehicle_type: r.vehicle_type,
    color: r.color,
    confidence: Number(r.confidence || 0.95),
    bounding_box: r.bounding_box,
  }));
};

export const saveDetectionToDb = async (pool, detection) => {
  if (!pool) return;
  await pool.query(
    `INSERT INTO detections (event_id, vehicle_id, plate_number, camera_id, camera_name, observed_at, vehicle_type, color, confidence, bounding_box)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (event_id) DO NOTHING`,
    [
      detection.event_id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      detection.vehicle_id,
      detection.plate_number,
      detection.camera_id,
      detection.camera_name,
      detection.observed_at || new Date().toISOString(),
      detection.vehicle_type || 'car',
      detection.color || 'White',
      detection.confidence || 0.95,
      JSON.stringify(detection.bounding_box || null),
    ]
  );
};

export const loadAlertsFromDb = async (pool) => {
  if (!pool) return [];
  const { rows } = await pool.query('SELECT * FROM alerts ORDER BY timestamp DESC LIMIT 50');
  return rows.map((r) => ({
    alert_id: r.alert_id,
    type: r.type,
    vehicle_id: r.vehicle_id,
    plate_number: r.plate_number,
    camera_id: r.camera_id,
    timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : new Date().toISOString(),
    details: r.details,
  }));
};

export const saveAlertToDb = async (pool, alert) => {
  if (!pool) return;
  await pool.query(
    `INSERT INTO alerts (alert_id, type, vehicle_id, plate_number, camera_id, timestamp, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (alert_id) DO NOTHING`,
    [
      alert.alert_id || `alt_${Date.now()}`,
      alert.type,
      alert.vehicle_id,
      alert.plate_number,
      alert.camera_id,
      alert.timestamp || new Date().toISOString(),
      JSON.stringify(alert.details || {}),
    ]
  );
};
