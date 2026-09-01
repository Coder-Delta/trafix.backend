export const searchVehicles = async (req, res, next) => {
  try {
    const { plate_number, camera_id, page = 1, limit = 20 } = req.query;

    res.status(200).json({
      success: true,
      data: {
        vehicles: [
          {
            vehicle_id: 'veh_001',
            plate_number: plate_number || 'ABC123',
            vehicle_type: 'car',
            confidence: 0.96,
            camera_id: camera_id || 'cam_001',
          },
        ],
        page: Number(page),
        limit: Number(limit),
        total: 1,
      },
      message: 'TODO: implement global vehicle identity search and filtering',
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleById = async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        vehicle_id,
        vehicle_type: 'car',
        plate_number: 'ABC123',
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        confidence: 0.96,
        camera_ids: ['cam_001'],
      },
      message: 'TODO: resolve global identity and avoid exposing raw embedding vectors through public APIs',
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleEvents = async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        vehicle_id,
        events: [
          {
            event_id: 'evt_123',
            camera_id: 'cam_001',
            observed_at: new Date().toISOString(),
            local_track_id: 'track_123',
            vehicle_confidence: 0.96,
            bounding_box: { x1: 10, y1: 20, x2: 200, y2: 180 },
          },
        ],
      },
      message: 'TODO: fetch ordered events by global vehicle identity',
    });
  } catch (error) {
    next(error);
  }
};

export const getVehicleTrajectory = async (req, res, next) => {
  try {
    const { vehicle_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        vehicle_id,
        points: [
          { timestamp: new Date().toISOString(), camera_id: 'cam_001', x: 10, y: 20 },
        ],
        summary: {
          total_points: 1,
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString(),
        },
      },
      message: 'TODO: compute or retrieve trajectory from stored detections',
    });
  } catch (error) {
    next(error);
  }
};

export default { searchVehicles, getVehicleById, getVehicleEvents, getVehicleTrajectory };
