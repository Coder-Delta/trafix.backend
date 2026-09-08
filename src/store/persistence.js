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

const nowMs = Date.now();
const timeAgoIso = (min) => new Date(nowMs - min * 60000).toISOString();

export const INITIAL_VEHICLES = [
  {
    vehicle_id: 'VH_001',
    id: 'VH_001',
    plate_number: 'WB12AB1234',
    plateNumber: 'WB12AB1234',
    vehicle_type: 'car',
    vehicleType: 'car',
    color: 'White',
    confidence: 0.96,
    camera_id: 'CAM_001',
    cameraId: 'CAM_001',
    camera_name: 'Park Street Junction',
    cameraName: 'Park Street Junction',
    latitude: 22.5535,
    longitude: 88.3525,
    first_seen_at: timeAgoIso(35),
    last_seen_at: timeAgoIso(5),
    detected_at: timeAgoIso(5),
    detectedAt: timeAgoIso(5),
    camera_ids: ['CAM_001', 'CAM_002', 'CAM_004', 'CAM_003'],
    embedding: null,
  },
  {
    vehicle_id: 'VH_002',
    id: 'VH_002',
    plate_number: 'WB06CD5678',
    plateNumber: 'WB06CD5678',
    vehicle_type: 'motorcycle',
    vehicleType: 'motorcycle',
    color: 'Black',
    confidence: 0.94,
    camera_id: 'CAM_002',
    cameraId: 'CAM_002',
    camera_name: 'Esplanade Crossing',
    cameraName: 'Esplanade Crossing',
    latitude: 22.5646,
    longitude: 88.3512,
    first_seen_at: timeAgoIso(25),
    last_seen_at: timeAgoIso(4),
    detected_at: timeAgoIso(4),
    detectedAt: timeAgoIso(4),
    camera_ids: ['CAM_005', 'CAM_001', 'CAM_002'],
    embedding: null,
  },
  {
    vehicle_id: 'VH_003',
    id: 'VH_003',
    plate_number: 'WB24EF9012',
    plateNumber: 'WB24EF9012',
    vehicle_type: 'bus',
    vehicleType: 'bus',
    color: 'Blue',
    confidence: 0.98,
    camera_id: 'CAM_003',
    cameraId: 'CAM_003',
    camera_name: 'Salt Lake Sector V',
    cameraName: 'Salt Lake Sector V',
    latitude: 22.5769,
    longitude: 88.4331,
    first_seen_at: timeAgoIso(18),
    last_seen_at: timeAgoIso(3),
    detected_at: timeAgoIso(3),
    detectedAt: timeAgoIso(3),
    camera_ids: ['CAM_004', 'CAM_002', 'CAM_003'],
    embedding: null,
  },
  {
    vehicle_id: 'VH_004',
    id: 'VH_004',
    plate_number: 'WB18GH3456',
    plateNumber: 'WB18GH3456',
    vehicle_type: 'truck',
    vehicleType: 'truck',
    color: 'Red',
    confidence: 0.92,
    camera_id: 'CAM_004',
    cameraId: 'CAM_004',
    camera_name: 'Howrah Bridge',
    cameraName: 'Howrah Bridge',
    latitude: 22.5958,
    longitude: 88.3476,
    first_seen_at: timeAgoIso(15),
    last_seen_at: timeAgoIso(2),
    detected_at: timeAgoIso(2),
    detectedAt: timeAgoIso(2),
    camera_ids: ['CAM_003', 'CAM_004'],
    embedding: null,
  },
];

export const INITIAL_DETECTIONS = [
  // WB12AB1234 Trajectory
  {
    event_id: 'DET_001',
    vehicle_id: 'VH_001',
    plate_number: 'WB12AB1234',
    camera_id: 'CAM_001',
    observed_at: timeAgoIso(35),
    vehicle_type: 'car',
    vehicle_confidence: 0.97,
    bounding_box: { x1: 120, y1: 200, x2: 340, y2: 380 },
  },
  {
    event_id: 'DET_002',
    vehicle_id: 'VH_001',
    plate_number: 'WB12AB1234',
    camera_id: 'CAM_002',
    observed_at: timeAgoIso(25),
    vehicle_type: 'car',
    vehicle_confidence: 0.96,
    bounding_box: { x1: 150, y1: 180, x2: 360, y2: 370 },
  },
  {
    event_id: 'DET_003',
    vehicle_id: 'VH_001',
    plate_number: 'WB12AB1234',
    camera_id: 'CAM_004',
    observed_at: timeAgoIso(15),
    vehicle_type: 'car',
    vehicle_confidence: 0.95,
    bounding_box: { x1: 100, y1: 220, x2: 310, y2: 410 },
  },
  {
    event_id: 'DET_004',
    vehicle_id: 'VH_001',
    plate_number: 'WB12AB1234',
    camera_id: 'CAM_003',
    observed_at: timeAgoIso(5),
    vehicle_type: 'car',
    vehicle_confidence: 0.96,
    bounding_box: { x1: 130, y1: 190, x2: 330, y2: 360 },
  },
  // WB06CD5678 Trajectory
  {
    event_id: 'DET_005',
    vehicle_id: 'VH_002',
    plate_number: 'WB06CD5678',
    camera_id: 'CAM_005',
    observed_at: timeAgoIso(25),
    vehicle_type: 'motorcycle',
    vehicle_confidence: 0.94,
    bounding_box: { x1: 80, y1: 150, x2: 180, y2: 290 },
  },
  {
    event_id: 'DET_006',
    vehicle_id: 'VH_002',
    plate_number: 'WB06CD5678',
    camera_id: 'CAM_001',
    observed_at: timeAgoIso(12),
    vehicle_type: 'motorcycle',
    vehicle_confidence: 0.95,
    bounding_box: { x1: 90, y1: 160, x2: 190, y2: 300 },
  },
  {
    event_id: 'DET_007',
    vehicle_id: 'VH_002',
    plate_number: 'WB06CD5678',
    camera_id: 'CAM_002',
    observed_at: timeAgoIso(4),
    vehicle_type: 'motorcycle',
    vehicle_confidence: 0.93,
    bounding_box: { x1: 110, y1: 170, x2: 210, y2: 310 },
  },
  // WB18GH3456 Trajectory (Wanted Truck)
  {
    event_id: 'DET_008',
    vehicle_id: 'VH_004',
    plate_number: 'WB18GH3456',
    camera_id: 'CAM_001',
    observed_at: timeAgoIso(15),
    vehicle_type: 'truck',
    vehicle_confidence: 0.95,
    bounding_box: { x1: 60, y1: 120, x2: 240, y2: 320 },
  },
  {
    event_id: 'DET_009',
    vehicle_id: 'VH_004',
    plate_number: 'WB18GH3456',
    camera_id: 'CAM_004',
    observed_at: timeAgoIso(2),
    vehicle_type: 'truck',
    vehicle_confidence: 0.92,
    bounding_box: { x1: 70, y1: 140, x2: 260, y2: 340 },
  },
];

export const HOTLIST_PLATES = new Set([
  'WB18GH3456', // Wanted in FIR-2026-BEL-04 (Commercial Cargo Theft)
  'DL01XY9999', // Stolen Sedan Flagged in NCR
  'MH02BZ1111', // High Priority Watchlist
]);

class DataStore {
  constructor() {
    this.cameras = new Map(INITIAL_CAMERAS.map((c) => [c.camera_id, { ...c }]));
    this.vehicles = new Map(INITIAL_VEHICLES.map((v) => [v.vehicle_id, { ...v }]));
    this.detections = [...INITIAL_DETECTIONS];
    this.alerts = [
      {
        id: 'ALT_001',
        type: 'cloned_plate',
        severity: 'critical',
        plate_number: 'WB12AB1234',
        vehicle_type: 'car',
        description: 'Simultaneous detection at Esplanade Crossing and Salt Lake Sector V within 30 seconds. Spatial-temporal velocity exceeds physical limits.',
        timestamp: new Date(Date.now() - 120000).toISOString(),
        cameras: ['CAM_002', 'CAM_003'],
      },
      {
        id: 'ALT_002',
        type: 'hotlist_match',
        severity: 'high',
        plate_number: 'WB18GH3456',
        vehicle_type: 'truck',
        description: 'Flagged in West Bengal Police FIR-2026-BEL-04 (Commercial Cargo Theft). Last observed crossing Howrah Bridge heading East.',
        timestamp: new Date(Date.now() - 420000).toISOString(),
        cameras: ['CAM_004'],
      },
    ];
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
    return updated;
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
    return vehicle;
  }

  // Detection Events
  saveDetection(detection) {
    this.detections.push(detection);
    this.incrementCameraVehicle(detection.camera_id, detection.vehicle_type || 'car');
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
    return alert;
  }

  // Analytics Overview
  getAnalyticsOverview() {
    const totalVehicles = this.vehicles.size + 87; // Total active tracking
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
