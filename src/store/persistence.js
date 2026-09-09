import 'dotenv/config';
import { getDatabasePool } from '../config/database.js';
import * as dbStore from './dbPersistence.js';

export const isDbMode = () => {
  const flag = (process.env.MVP_DEMO_MODE || '').trim().toLowerCase();
  return flag === 'true' || flag === '1' || flag === 'db';
};

/**
 * Unified In-Memory & Database-Ready Persistence Store
 * Stores Kolkata ANPR surveillance data:
 * - Cameras (5 Kolkata Junctions)
 * - Vehicles (Identities, plates, embeddings, color, type)
 * - Detection Events (Chronological logs from YOLOv8 + EasyOCR + Re-ID)
 * - Trajectories & Route Waypoints
 * - Security & Anomaly Alerts (Cloned plates, hotlist matches)
 */

export const INITIAL_CAMERAS = [
  {
    camera_id: 'CAM_001',
    id: 'CAM_001',
    name: 'Park Street Junction',
    latitude: 22.5535,
    longitude: 88.3525,
    location: { lat: 22.5535, lng: 88.3525 },
    status: 'online',
    fps: 24,
    vehicle_count: 18,
    vehicleCount: 18,
    traffic_level: 'moderate',
    trafficLevel: 'moderate',
    stream_url: '/videos/sample_traffic.mp4',
    detected_vehicles: { car: 12, motorcycle: 3, bus: 2, truck: 1, van: 0, taxi: 0 },
    detectedVehicles: { car: 12, motorcycle: 3, bus: 2, truck: 1, van: 0, taxi: 0 },
    last_heartbeat: new Date().toISOString(),
  },
  {
    camera_id: 'CAM_002',
    id: 'CAM_002',
    name: 'Esplanade Crossing',
    latitude: 22.5646,
    longitude: 88.3512,
    location: { lat: 22.5646, lng: 88.3512 },
    status: 'online',
    fps: 30,
    vehicle_count: 27,
    vehicleCount: 27,
    traffic_level: 'high',
    trafficLevel: 'high',
    stream_url: '/videos/junction_traffic.mp4',
    detected_vehicles: { car: 16, motorcycle: 6, bus: 3, truck: 1, van: 1, taxi: 0 },
    detectedVehicles: { car: 16, motorcycle: 6, bus: 3, truck: 1, van: 1, taxi: 0 },
    last_heartbeat: new Date().toISOString(),
  },
  {
    camera_id: 'CAM_003',
    id: 'CAM_003',
    name: 'Salt Lake Sector V',
    latitude: 22.5769,
    longitude: 88.4331,
    location: { lat: 22.5769, lng: 88.4331 },
    status: 'online',
    fps: 25,
    vehicle_count: 11,
    vehicleCount: 11,
    traffic_level: 'low',
    trafficLevel: 'low',
    stream_url: '/videos/sample_traffic.mp4',
    detected_vehicles: { car: 7, motorcycle: 2, bus: 1, truck: 0, van: 1, taxi: 0 },
    detectedVehicles: { car: 7, motorcycle: 2, bus: 1, truck: 0, van: 1, taxi: 0 },
    last_heartbeat: new Date().toISOString(),
  },
  {
    camera_id: 'CAM_004',
    id: 'CAM_004',
    name: 'Howrah Bridge',
    latitude: 22.5958,
    longitude: 88.3476,
    location: { lat: 22.5958, lng: 88.3476 },
    status: 'online',
    fps: 24,
    vehicle_count: 35,
    vehicleCount: 35,
    traffic_level: 'critical',
    trafficLevel: 'critical',
    stream_url: '/videos/junction_traffic.mp4',
    detected_vehicles: { car: 18, motorcycle: 8, bus: 4, truck: 3, van: 1, taxi: 1 },
    detectedVehicles: { car: 18, motorcycle: 8, bus: 4, truck: 3, van: 1, taxi: 1 },
    last_heartbeat: new Date().toISOString(),
  },
  {
    camera_id: 'CAM_005',
    id: 'CAM_005',
    name: 'Gariahat Junction',
    latitude: 22.5186,
    longitude: 88.3654,
    location: { lat: 22.5186, lng: 88.3654 },
    status: 'offline',
    fps: 0,
    vehicle_count: 0,
    vehicleCount: 0,
    traffic_level: 'low',
    trafficLevel: 'low',
    stream_url: '/videos/sample_traffic.mp4',
    detected_vehicles: { car: 0, motorcycle: 0, bus: 0, truck: 0, van: 0, taxi: 0 },
    detectedVehicles: { car: 0, motorcycle: 0, bus: 0, truck: 0, van: 0, taxi: 0 },
    last_heartbeat: new Date().toISOString(),
  },
];

export const HOTLIST_PLATES = new Set([
  'WB18GH3456', // Wanted in FIR-2026-BEL-04 (Commercial Cargo Theft)
  'DL01XY9999', // Stolen Sedan Flagged in NCR
  'MH02BZ1111', // High Priority Watchlist
]);

class DataStore {
  constructor() {
    this.cameras = new Map(INITIAL_CAMERAS.map((c) => [c.camera_id, { ...c, vehicle_count: 0, vehicleCount: 0 }]));
    this.vehicles = new Map();
    this.detections = [];
    this.alerts = [];
  }

  async init() {
    if (isDbMode()) {
      console.log('[persistence] MVP_DEMO_MODE=true: Database Persistence Mode active. Syncing with PostgreSQL...');
      const pool = getDatabasePool();
      if (pool) {
        try {
          await dbStore.createTables(pool);
          const dbCameras = await dbStore.loadCamerasFromDb(pool);
          if (dbCameras.length === 0) {
            console.log('[persistence] Seeding initial cameras into PostgreSQL...');
            await dbStore.seedCamerasToDb(pool, INITIAL_CAMERAS);
            const seeded = await dbStore.loadCamerasFromDb(pool);
            this.cameras = new Map(seeded.map((c) => [c.camera_id, c]));
          } else {
            this.cameras = new Map(dbCameras.map((c) => [c.camera_id, c]));
          }

          const dbVehicles = await dbStore.loadVehiclesFromDb(pool);
          this.vehicles = new Map(dbVehicles.map((v) => [v.vehicle_id, v]));

          const dbDetections = await dbStore.loadDetectionsFromDb(pool);
          this.detections = dbDetections;

          const dbAlerts = await dbStore.loadAlertsFromDb(pool);
          this.alerts = dbAlerts;
          console.log(`[persistence] DB sync complete: ${this.cameras.size} cameras, ${this.vehicles.size} vehicles, ${this.detections.length} detections.`);
        } catch (err) {
          console.error('[persistence] Failed to sync with PostgreSQL:', err.message);
        }
      }
    } else {
      console.log('[persistence] MVP_DEMO_MODE=false: In-Memory Clean-Slate Mode active. Starting 100% fresh on restart with zero leftover data.');
      this.cameras = new Map(INITIAL_CAMERAS.map((c) => [c.camera_id, { ...c, vehicle_count: 0, vehicleCount: 0 }]));
      this.vehicles = new Map();
      this.detections = [];
      this.alerts = [];
    }
  }

  // Camera methods
  getCameras() {
    return Array.from(this.cameras.values());
  }

  getCamera(cameraId) {
    return this.cameras.get(cameraId) || null;
  }

  updateCamera(cameraId, updateData) {
    const existing = this.cameras.get(cameraId);
    if (!existing) return null;
    const updated = { ...existing, ...updateData, last_heartbeat: new Date().toISOString() };
    this.cameras.set(cameraId, updated);
    if (isDbMode()) {
      dbStore.updateCameraInDb(getDatabasePool(), cameraId, updateData).catch((err) => console.warn('[db] updateCamera error:', err.message));
    }
    return updated;
  }

  addCamera(cameraData) {
    const nextIdx = this.cameras.size + 1;
    const cameraId = cameraData.camera_id || cameraData.id || `CAM_${String(nextIdx).padStart(3, '0')}`;
    const lat = Number(cameraData.latitude ?? cameraData.lat ?? 22.5535);
    const lng = Number(cameraData.longitude ?? cameraData.lng ?? 88.3525);
    const camera = {
      camera_id: cameraId,
      id: cameraId,
      name: cameraData.name || `Camera ${cameraId}`,
      latitude: lat,
      longitude: lng,
      location: { lat, lng },
      direction: cameraData.direction || 'Northbound',
      status: cameraData.status || 'online',
      fps: cameraData.fps !== undefined ? Number(cameraData.fps) : 25,
      vehicle_count: 0,
      vehicleCount: 0,
      traffic_level: 'low',
      trafficLevel: 'low',
      stream_url: cameraData.stream_url || cameraData.streamUrl || '/videos/sample_traffic.mp4',
      detected_vehicles: { car: 0, motorcycle: 0, bus: 0, truck: 0, van: 0, taxi: 0 },
      detectedVehicles: { car: 0, motorcycle: 0, bus: 0, truck: 0, van: 0, taxi: 0 },
      last_heartbeat: new Date().toISOString(),
    };
    this.cameras.set(cameraId, camera);
    if (isDbMode()) {
      dbStore.saveCameraToDb(getDatabasePool(), camera).catch((err) => console.warn('[db] addCamera error:', err.message));
    }
    return camera;
  }

  deleteCamera(cameraId) {
    const deleted = this.cameras.delete(cameraId);
    if (isDbMode()) {
      dbStore.deleteCameraFromDb(getDatabasePool(), cameraId).catch((err) => console.warn('[db] deleteCamera error:', err.message));
    }
    return deleted;
  }

  clearCameras() {
    this.cameras.clear();
    return [];
  }

  resetCameras() {
    this.cameras = new Map(INITIAL_CAMERAS.map((c) => [c.camera_id, { ...c, vehicle_count: 0, vehicleCount: 0 }]));
    return Array.from(this.cameras.values());
  }

  incrementCameraVehicle(cameraId, vehicleType) {
    const cam = this.cameras.get(cameraId);
    if (!cam) return;
    cam.vehicle_count = (cam.vehicle_count || 0) + 1;
    cam.vehicleCount = cam.vehicle_count;
    if (cam.detected_vehicles && cam.detected_vehicles[vehicleType] !== undefined) {
      cam.detected_vehicles[vehicleType] += 1;
    }
    if (cam.detectedVehicles && cam.detectedVehicles[vehicleType] !== undefined) {
      cam.detectedVehicles[vehicleType] += 1;
    }
  }

  // Vehicle methods
  getAllVehicles() {
    return Array.from(this.vehicles.values());
  }

  getVehicleById(vehicleId) {
    return this.vehicles.get(vehicleId) || null;
  }

  findVehicleByPlate(plateNumber) {
    if (!plateNumber) return null;
    const cleanTarget = plateNumber.replace(/[\s-]/g, '').toUpperCase();
    for (const vehicle of this.vehicles.values()) {
      const cleanPlate = (vehicle.plate_number || vehicle.plateNumber || '').replace(/[\s-]/g, '').toUpperCase();
      const cleanId = (vehicle.vehicle_id || vehicle.id || '').replace(/[\s-]/g, '').toUpperCase();
      const cleanTrack = (vehicle.local_track_id || '').replace(/[\s-]/g, '').toUpperCase();

      if (
        cleanPlate === cleanTarget || cleanPlate.includes(cleanTarget) ||
        cleanId === cleanTarget || cleanId.includes(cleanTarget) ||
        (cleanTrack && (cleanTrack === cleanTarget || cleanTrack.includes(cleanTarget)))
      ) {
        return vehicle;
      }
    }
    return null;
  }

  getRecentVehicles(limit = 10) {
    return Array.from(this.vehicles.values())
      .sort((a, b) => new Date(b.last_seen_at || b.detected_at).getTime() - new Date(a.last_seen_at || a.detected_at).getTime())
      .slice(0, limit);
  }

  getRecentDetections(limit = 10) {
    return this.detections.slice(-limit).reverse();
  }

  saveVehicle(vehicle) {
    this.vehicles.set(vehicle.vehicle_id, vehicle);
    if (isDbMode()) {
      dbStore.saveVehicleToDb(getDatabasePool(), vehicle).catch((err) => console.warn('[db] saveVehicle error:', err.message));
    }
    return vehicle;
  }

  // Detection Events
  saveDetection(detection) {
    this.detections.push(detection);
    this.incrementCameraVehicle(detection.camera_id, detection.vehicle_type || 'car');
    if (isDbMode()) {
      dbStore.saveDetectionToDb(getDatabasePool(), detection).catch((err) => console.warn('[db] saveDetection error:', err.message));
    }
    return detection;
  }

  getDetectionsByVehicleId(vehicleId) {
    return this.detections.filter((d) => d.vehicle_id === vehicleId);
  }

  // Trajectory Reconstruction
  getVehicleTrajectory(vehicleIdOrPlate) {
    let vehicle = this.getVehicleById(vehicleIdOrPlate);
    if (!vehicle) {
      vehicle = this.findVehicleByPlate(vehicleIdOrPlate);
    }
    if (!vehicle) return null;

    const detections = this.detections
      .filter((d) => d.vehicle_id === vehicle.vehicle_id || (vehicle.plate_number && d.plate_number === vehicle.plate_number))
      .sort((a, b) => (a.observed_at > b.observed_at ? 1 : -1));

    const points = detections.map((det, index) => {
      const camera = this.getCamera(det.camera_id);
      return {
        event_id: det.event_id || `DET_${index + 1}`,
        camera_id: det.camera_id,
        camera_name: camera?.name || det.camera_id,
        latitude: camera?.latitude || 22.5535,
        longitude: camera?.longitude || 88.3525,
        timestamp: det.observed_at,
        bounding_box: det.bounding_box,
      };
    });

    return {
      vehicle_id: vehicle.vehicle_id,
      plate_number: vehicle.plate_number,
      vehicle_type: vehicle.vehicle_type,
      points,
      summary: {
        total_points: points.length,
        start_time: points[0]?.timestamp || null,
        end_time: points[points.length - 1]?.timestamp || null,
      },
    };
  }

  // Alerts
  getAlerts() {
    return this.alerts;
  }

  addAlert(alert) {
    this.alerts.unshift(alert);
    if (isDbMode()) {
      dbStore.saveAlertToDb(getDatabasePool(), alert).catch((err) => console.warn('[db] saveAlert error:', err.message));
    }
    return alert;
  }

  // Analytics Overview
  getAnalyticsOverview() {
    const totalVehicles = this.vehicles.size;
    const activeCameras = Array.from(this.cameras.values()).filter((c) => c.status === 'online').length;
    const totalCameras = this.cameras.size;

    return {
      total_vehicles: totalVehicles,
      totalVehicles,
      active_cameras: activeCameras,
      activeCameras,
      total_cameras: totalCameras,
      totalCameras,
      congestion_level: 'high',
      congestionLevel: 'high',
      vehicle_distribution: {
        car: 53,
        motorcycle: 19,
        bus: 10,
        truck: 6,
        van: 2,
        taxi: 1,
      },
      camera_traffic: Array.from(this.cameras.values()).map((cam) => ({
        cameraId: cam.camera_id,
        cameraName: cam.name,
        vehicleCount: cam.vehicle_count || 15,
        congestionLevel: cam.traffic_level || 'moderate',
      })),
      hourly_traffic: [
        { hour: '08:00', vehicleCount: 32 },
        { hour: '09:00', vehicleCount: 48 },
        { hour: '10:00', vehicleCount: 67 },
        { hour: '11:00', vehicleCount: 74 },
        { hour: '12:00', vehicleCount: 81 },
        { hour: '13:00', vehicleCount: 91 },
      ],
    };
  }
}

export const dataStore = new DataStore();
export default dataStore;
