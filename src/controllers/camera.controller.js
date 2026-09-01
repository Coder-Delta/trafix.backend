export const listCameras = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        cameras: [
          {
            camera_id: 'cam_001',
            name: 'North Gate Camera',
            status: 'online',
            location: { lat: 0, lng: 0 },
            stream_url: 'todo://camera-stream',
            created_at: new Date().toISOString(),
          },
        ],
        total: 1,
      },
      message: 'TODO: fetch cameras from persistence layer',
    });
  } catch (error) {
    next(error);
  }
};

export const getCameraById = async (req, res, next) => {
  try {
    const { camera_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        camera_id,
        name: 'North Gate Camera',
        status: 'online',
        location: { lat: 0, lng: 0 },
        stream_url: 'todo://camera-stream',
      },
      message: 'TODO: load camera by id from persistence layer',
    });
  } catch (error) {
    next(error);
  }
};

export const getCameraStatus = async (req, res, next) => {
  try {
    const { camera_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        camera_id,
        status: 'online',
        heartbeat_at: new Date().toISOString(),
        health: {
          latency_ms: 0,
          dropped_frames: 0,
          fps: 0,
        },
      },
      message: 'TODO: implement live health checks and heartbeat aggregation',
    });
  } catch (error) {
    next(error);
  }
};

export const cameraHeartbeat = async (req, res, next) => {
  try {
    const { camera_id } = req.params;

    res.status(200).json({
      success: true,
      data: {
        camera_id,
        status: 'online',
        heartbeat_at: new Date().toISOString(),
      },
      message: 'TODO: record heartbeat and update camera liveness',
    });
  } catch (error) {
    next(error);
  }
};

export default { listCameras, getCameraById, getCameraStatus, cameraHeartbeat };
